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

// Configure CORS for Replit's domain
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true
}));

// Rate limiting - gentle limits for testing
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
      // In production, serve from dist/public
      const distPath = path.resolve(process.cwd(), "dist", "public");
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
      const message = process.env.NODE_ENV === "production"
        ? "Internal Server Error" // Don't expose error details in production
        : err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // 404 handler
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ message: "Not Found" });
    });

    // Start server
    const PORT = process.env.PORT || 3000; // Use Replit's PORT env var
    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();