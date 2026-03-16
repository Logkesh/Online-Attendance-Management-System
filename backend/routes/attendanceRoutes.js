import { Router } from 'express';
import { markAttendance, studentAttendanceHistory } from '../controllers/attendanceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/mark', authMiddleware, markAttendance);
router.get('/student/:student_id', authMiddleware, studentAttendanceHistory);

export default router;
