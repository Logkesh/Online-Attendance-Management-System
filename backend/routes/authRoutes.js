import { Router } from 'express';
import { facultyLogin, studentLogin } from '../controllers/authController.js';

const router = Router();

router.post('/faculty/login', facultyLogin);
router.post('/student/login', studentLogin);

export default router;
