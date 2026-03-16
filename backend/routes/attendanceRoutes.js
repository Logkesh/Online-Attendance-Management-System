import { Router } from 'express';
import { markAttendance, studentAttendanceHistory, studentsByClass } from '../controllers/attendanceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/mark', authMiddleware, markAttendance);
router.get('/class/:class_id/students', authMiddleware, studentsByClass);
router.get('/student/:student_id', authMiddleware, studentAttendanceHistory);

export default router;
