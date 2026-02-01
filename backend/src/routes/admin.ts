import { Router } from 'express';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import {
  getAdminList,
  grantAdminStatus,
  revokeAdminStatus,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllPurchases,
} from '../controllers/adminController';

const router = Router();

router.get('/admins', authenticateJWT, requireAdmin, getAdminList);
router.post('/users/:uid/admin', authenticateJWT, requireAdmin, grantAdminStatus);
router.delete('/users/:uid/admin', authenticateJWT, requireAdmin, revokeAdminStatus);

// User management
router.get('/users', authenticateJWT, requireAdmin, getAllUsers);
router.put('/users/:uid', authenticateJWT, requireAdmin, updateUser);
router.delete('/users/:uid', authenticateJWT, requireAdmin, deleteUser);

// Purchase management
router.get('/purchases', authenticateJWT, requireAdmin, getAllPurchases);

export default router;
