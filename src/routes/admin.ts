import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { storage } from '../storage';
import { insertAdminSchema, insertMonthlyMenuItemSchema } from '../../shared/schema';
import type { InsertAdmin } from '../../shared/schema';

const router = Router();

// Admin authentication check
router.get('/check', requireAdmin, (req, res) => {
  res.json({ isAdmin: true });
});

// Create new admin account (admin only)
router.post('/create-admin', requireAdmin, async (req, res) => {
  try {
    const data = insertAdminSchema.parse(req.body);
    const newAdmin = await storage.createUser(data as InsertAdmin);
    res.status(201).json({ success: true, admin: newAdmin });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Monthly menu management
router.post('/menu-items', requireAdmin, async (req, res) => {
  try {
    const data = insertMonthlyMenuItemSchema.parse(req.body);
    const menuItem = await storage.createMonthlyMenuItem(data);
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/menu-items/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = insertMonthlyMenuItemSchema.partial().parse(req.body);
    const updatedItem = await storage.updateMonthlyMenuItem(parseInt(id), data);
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/menu-items', requireAdmin, async (req, res) => {
  try {
    const items = await storage.getAllMonthlyMenuItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
