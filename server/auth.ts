import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "../shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

async function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH);
  const hash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${hash.toString('hex')}.${salt.toString('hex')}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashedPart, saltPart] = stored.split(".");
  const salt = Buffer.from(saltPart, 'hex');
  const storedHash = Buffer.from(hashedPart, 'hex');
  const suppliedHash = (await scryptAsync(supplied, salt, KEY_LENGTH)) as Buffer;
  return timingSafeEqual(storedHash, suppliedHash);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to false for development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for username: ${username}`);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log('User not found');
          return done(null, false, { message: "Invalid username or password" });
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          console.log('Invalid password');
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('Login successful');
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization');
        return done(null, false);
      }
      console.log('User deserialized successfully');
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Registration attempt:', req.body.username);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Username already exists');
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return next(err);
        }
        console.log('Registration successful');
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    console.log('Login request received');
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ error: info?.message || "Invalid username or password" });
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        console.log('Login successful');
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    console.log('Logout request received');
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      console.log('Logout successful');
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    console.log('Get user request:', req.isAuthenticated());
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}