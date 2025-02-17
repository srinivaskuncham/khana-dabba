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
  const result = `${hash.toString('hex')}.${salt.toString('hex')}`;
  console.log('Generated hash:', {
    hashLength: hash.length,
    saltLength: salt.length,
    resultLength: result.length,
    resultFormat: result.includes('.') ? 'hash.salt' : 'invalid'
  });
  return result;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    console.log('Comparing passwords:', {
      storedLength: stored.length,
      storedFormat: stored.includes('.') ? 'hash.salt' : 'invalid',
    });

    const [hashedPart, saltPart] = stored.split(".");

    if (!hashedPart || !saltPart) {
      console.error('Invalid stored password format - missing hash or salt');
      return false;
    }

    const salt = Buffer.from(saltPart, 'hex');
    const storedHash = Buffer.from(hashedPart, 'hex');
    const suppliedHash = (await scryptAsync(supplied, salt, KEY_LENGTH)) as Buffer;

    console.log('Password comparison details:', {
      storedHashLength: storedHash.length,
      suppliedHashLength: suppliedHash.length,
      saltLength: salt.length,
      expectedLength: KEY_LENGTH
    });

    return timingSafeEqual(storedHash, suppliedHash);
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
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username: string, password: string, done) => {
      try {
        console.log('Login attempt:', { username });
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log('User not found:', { username });
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log('Found user:', { 
          username, 
          userId: user.id,
          passwordLength: user.password.length,
          passwordFormat: user.password.includes('.') ? 'hash.salt' : 'invalid'
        });

        const isValid = await comparePasswords(password, user.password);

        console.log('Password validation result:', { 
          username, 
          isValid,
          suppliedPasswordLength: password.length,
          storedPasswordLength: user.password.length
        });

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
    }),
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

  // Helper function to create admin user
  async function createAdminUser() {
    try {
      const adminUsername = "admin";
      const adminPassword = "admin123";

      // Check if admin already exists
      const existingAdmin = await storage.getUserByUsername(adminUsername);
      if (existingAdmin) {
        console.log('Admin user already exists, skipping creation');
        return;
      }

      const hashedPassword = await hashPassword(adminPassword);
      console.log('Creating admin user:', {
        username: adminUsername,
        hashLength: hashedPassword.length,
        hashFormat: hashedPassword.includes('.') ? 'hash.salt' : 'invalid'
      });

      const user = await storage.createUser({
        username: adminUsername,
        password: hashedPassword,
        name: "Admin User",
        email: "admin@khanadabba.com",
        isAdmin: true
      });

      console.log('Admin user created successfully:', {
        userId: user.id,
        username: user.username
      });
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  }

  // Create admin user on startup
  createAdminUser();

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log('Created hash for new user:', { 
        username: req.body.username, 
        hashLength: hashedPassword.length,
        hashFormat: hashedPassword.includes('.') ? 'hash.salt' : 'invalid'
      });

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
    console.log('Login request received:', { 
      username: req.body.username,
      passwordLength: req.body.password?.length
    });

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