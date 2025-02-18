import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Ensure NODE_ENV is set
process.env.NODE_ENV = process.env.NODE_ENV || "development";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server initialization...");
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Server Error:', err);
    });

    // Setup vite in development and static serving in production
    if (process.env.NODE_ENV === "development") {
      log("Setting up development server with Vite...");
      await setupVite(app, server);
    } else {
      log("Setting up production static serving...");
      serveStatic(app);
    }

    const PORT = 5000;  // Explicitly set port to 5000
    const HOST = "0.0.0.0";

    server.listen(PORT, HOST, () => {
      log(`🚀 Server running in ${process.env.NODE_ENV} mode at http://${HOST}:${PORT}`);
      log(`Environment: ${process.env.NODE_ENV}`);
      log(`Port: ${PORT}`);
      log(`Host: ${HOST}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});