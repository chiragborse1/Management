import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as feedbackController from '../controllers/feedbackController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createFeedbackSchema, feedbackQuerySchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Feedback: students give, everyone reads target ratings
router.post(
  '/',
  authorize('student'),
  validate(createFeedbackSchema),
  asyncHandler(feedbackController.createFeedback)
);
router.get('/my', authorize('student'), asyncHandler(feedbackController.getMyFeedback));
router.get(
  '/target/:targetType/:targetId',
  authorize('student', 'admin', 'mess_owner'),
  validate(feedbackQuerySchema, 'query'),
  asyncHandler(feedbackController.getTargetFeedback)
);

export default router;
