import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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
    if (app.get("env") === "development") {
      log("Setting up development server with Vite...");
      await setupVite(app, server);
    } else {
      log("Setting up production static serving...");
      serveStatic(app);
    }

    // Use Replit's PORT if available, otherwise fallback to 5000
    const PORT = Number(process.env.PORT || 5000);
    const HOST = "0.0.0.0";

    // Handle port in use error gracefully
    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        log(`Port ${PORT} is in use. Please ensure no other server is running.`);
        process.exit(1);
      } else {
        console.error('Server error:', e);
        process.exit(1);
      }
    });

    // Bind to 0.0.0.0 for Replit hosting
    server.listen(PORT, HOST, () => {
      log(`🚀 Server running in ${app.get("env")} mode at http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});