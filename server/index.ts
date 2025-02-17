import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import path from "path";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in development
}));

// Configure CORS for same origin
app.use(cors({
  credentials: true, // Allow credentials (cookies)
  origin: true, // Allow same origin in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${path}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Response sent: ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });

  next();
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Received shutdown signal, closing server...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

(async () => {
  try {
    // Setup authentication first
    setupAuth(app);
    console.log('Auth setup completed');

    // Then register other routes
    const server = await registerRoutes(app);
    console.log('Routes registered');

    // Setup Vite or static serving
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      console.log('Vite development server setup completed');
    } else {
      const distPath = path.resolve(process.cwd(), "dist", "public");
      console.log('Production static files path:', distPath);

      app.use(express.static(distPath));

      // Serve index.html for all non-API routes (SPA support)
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
      });

      console.log('Static file serving setup completed');
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ message: "Not Found" });
    });

    // Start server
    const PORT = 5000;
    console.log('Starting server with environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: PORT,
      REPL_ID: process.env.REPL_ID,
      REPL_SLUG: process.env.REPL_SLUG
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server started and listening on port ${PORT}`);
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();