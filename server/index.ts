import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup basic error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Setup logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  console.log(`[${new Date().toISOString()}] Starting ${req.method} ${path}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Completed ${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });

  next();
});

let isInitialized = false;

(async () => {
  try {
    if (isInitialized) {
      console.log('Server already initialized, skipping...');
      return;
    }

    console.log('Starting server initialization...');

    // Setup authentication first
    console.log('Setting up authentication...');
    setupAuth(app);
    console.log('Auth setup completed');

    // Then register other routes
    console.log('Registering routes...');
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    // Setup Vite only in development
    if (app.get("env") === "development") {
      console.log('Setting up Vite development server...');
      await setupVite(app, server);
      console.log('Vite development server setup completed');
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    const HOST = '0.0.0.0';
    console.log(`Attempting to start server on ${HOST}:${PORT}...`);

    server.listen(PORT, HOST, () => {
      console.log(`Server started successfully on ${HOST}:${PORT}`);
      log(`Server running at http://${HOST}:${PORT}`);
    });

    isInitialized = true;
  } catch (error) {
    console.error('Failed to start server:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
})();