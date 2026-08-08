import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as studentController from '../controllers/studentController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateStudentProfileSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Student profile & room
router.get('/me', authorize('student'), asyncHandler(studentController.getMyProfile));
router.patch(
  '/me',
  authorize('student'),
  validate(updateStudentProfileSchema),
  asyncHandler(studentController.updateMyProfile)
);
router.get('/me/room', authorize('student'), asyncHandler(studentController.getMyRoom));

export default router;
