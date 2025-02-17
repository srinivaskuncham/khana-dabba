import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite,  log } from "./vite";
import { setupAuth } from "./auth";
import path from "path";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in development
}));

// Set trust proxy before other middleware
app.set('trust proxy', 1);

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${path} ${res.statusCode} ${duration}ms`);
  });

  next();
});

(async () => {
  try {
    // Setup authentication
    setupAuth(app);
    console.log('Auth setup completed');

    // Register API routes
    const server = await registerRoutes(app);
    console.log('Routes registered');

    // In development, use Vite's dev server
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      console.log('Vite development server setup completed');
    } else {
      // In production, serve static files from dist/public
      const distPath = path.join(process.cwd(), "dist", "public");
      app.use(express.static(distPath));

      // Serve index.html for client-side routing
      app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api')) return;
        res.sendFile(path.join(distPath, 'index.html'));
      });

      console.log('Static file serving setup completed from:', distPath);
    }

    // Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      res.status(err.status || 500).json({ 
        message: err.message || "Internal Server Error" 
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();