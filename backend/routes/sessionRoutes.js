import { Router } from 'express';
import { createSession, facultySessions, validateSession } from '../controllers/sessionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create', authMiddleware, createSession);
router.post('/validate', authMiddleware, validateSession);
router.get('/faculty/:faculty_id', authMiddleware, facultySessions);

export default router;
