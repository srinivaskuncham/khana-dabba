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
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

async function hashPassword(password: string) {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const hash = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const result = Buffer.concat([hash, salt]).toString('hex');
    return result;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const buf = Buffer.from(stored, 'hex');
    const hash = buf.subarray(0, KEY_LENGTH);
    const salt = buf.subarray(KEY_LENGTH);
    const suppliedHash = await scryptAsync(supplied, salt, KEY_LENGTH) as Buffer;
    return timingSafeEqual(hash, suppliedHash);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Login attempt:', { username });
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log('User not found:', { username });
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('Found user:', { username, userId: user.id });
        const isValid = await comparePasswords(password, user.password);

        if (!isValid) {
          console.log('Invalid password for user:', { username });
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('Login successful:', { username, userId: user.id });
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', { userId: user.id });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', { userId: id });
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization:', { userId: id });
        return done(null, false);
      }
      console.log('Deserialized user:', { userId: id, username: user.username });
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log('Created hash for new user:', { username: req.body.username, hashLength: hashedPassword.length });

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) {
          console.error('Registration login error:', err);
          return next(err);
        }
        console.log('Registration successful:', { username: user.username, userId: user.id });
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request received:', { username: req.body.username });
    passport.authenticate("local", (err, user, info) => {
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
        console.log('Login successful:', { username: user.username, userId: user.id });
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const username = req.user?.username;
    console.log('Logout request:', { username });
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      console.log('Logout successful:', { username });
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('User check:', { 
      isAuthenticated: req.isAuthenticated(),
      username: req.user?.username 
    });

    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}