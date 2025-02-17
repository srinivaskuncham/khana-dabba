import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "../shared/schema";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

async function hashPassword(password: string) {
  try {
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
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
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

    return timingSafeEqual(storedHash, suppliedHash);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  try {
    console.log('Initializing auth setup...');

    const sessionSettings: session.SessionOptions = {
      secret: "your-secret-key", // In production, use environment variable
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
      }
    };

    console.log('Configuring session middleware...');
    app.set("trust proxy", 1);
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());
    console.log('Session middleware configured successfully');

    console.log('Setting up passport strategy...');
    passport.use(
      new LocalStrategy(async (username: string, password: string, done) => {
        try {
          console.log('Login attempt:', { username });
          const user = await storage.getUserByUsername(username);

          if (!user) {
            console.log('User not found:', { username });
            return done(null, false, { message: "Invalid username or password" });
          }

          const isValid = await comparePasswords(password, user.password);

          if (!isValid) {
            console.log('Invalid password for user:', { username });
            return done(null, false, { message: "Invalid username or password" });
          }

          console.log('Login successful:', { username });
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

    console.log('Auth setup completed successfully');
  } catch (error) {
    console.error('Failed to setup authentication:', error);
    throw error;
  }
}