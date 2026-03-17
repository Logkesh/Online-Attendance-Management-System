import { Router } from 'express';
import { manualMarkAttendance, markAttendance, studentAttendanceHistory, studentsByClass } from '../controllers/attendanceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/mark', authMiddleware, markAttendance);
router.post('/manual-mark', authMiddleware, manualMarkAttendance);
router.get('/class/:class_id/students', authMiddleware, studentsByClass);
router.get('/student/:student_id', authMiddleware, studentAttendanceHistory);

export default router;
