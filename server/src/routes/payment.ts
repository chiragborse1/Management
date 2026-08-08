import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as paymentController from '../controllers/paymentController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { studentCreatePaymentSchema, paymentQuerySchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Student billing
router.get(
  '/my',
  authorize('student'),
  validate(paymentQuerySchema, 'query'),
  asyncHandler(paymentController.getMyPayments)
);
router.get('/bill/monthly', authorize('student'), asyncHandler(paymentController.getMonthlyBill));
router.post(
  '/',
  authorize('student'),
  validate(studentCreatePaymentSchema),
  asyncHandler(paymentController.createPayment)
);

export default router;
