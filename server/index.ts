import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup basic error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Setup CSP and other security headers
app.use((req, res, next) => {
  // Set CSP header to allow necessary resources
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});

// Setup logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
    setupAuth(app);
    console.log('Auth setup completed');

    // Register API routes
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    // Serve static files from the dist directory
    const distPath = path.join(__dirname, '../client/dist/public');
    console.log('Serving static files from:', distPath);
    app.use(express.static(distPath));

    // Handle SPA routing - send index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        const indexPath = path.join(distPath, 'index.html');
        console.log('Serving SPA index.html from:', indexPath);
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).json({ message: "Error loading application" });
          }
        });
      }
    });

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({ message: "Internal Server Error" });
    });

    // Start server
    const PORT = 5000;
    const HOST = '0.0.0.0';

    server.listen(PORT, HOST, () => {
      console.log(`Server running at http://${HOST}:${PORT}`);
    });

    isInitialized = true;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();