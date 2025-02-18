import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { setupAuth } from "./auth";
import path from "path";

const app = express();

// Basic security middleware with CSP disabled for development
app.use(helmet({
  contentSecurityPolicy: false,
}));


// Configure CORS for development
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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
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

    // Setup Vite's dev server
    await setupVite(app, server);
    console.log('Vite development server setup completed');

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      res.status(err.status || 500).json({ 
        message: err.message || "Internal Server Error" 
      });
    });

    // Start server on port 5000
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();