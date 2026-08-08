import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as subscriptionController from '../controllers/subscriptionController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requestSubscriptionSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Student subscriptions
router.post(
  '/',
  authorize('student'),
  validate(requestSubscriptionSchema),
  asyncHandler(subscriptionController.requestSubscription)
);
router.get('/my', authorize('student'), asyncHandler(subscriptionController.getMySubscriptions));
router.get('/:id', authorize('student'), asyncHandler(subscriptionController.getSubscriptionById));
router.post(
  '/:id/cancel',
  authorize('student'),
  asyncHandler(subscriptionController.cancelSubscription)
);

export default router;
