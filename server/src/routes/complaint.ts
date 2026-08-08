import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as complaintController from '../controllers/complaintController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createComplaintSchema,
  complaintQuerySchema,
  addComplaintCommentSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Student complaints
router.post(
  '/',
  authorize('student'),
  validate(createComplaintSchema),
  asyncHandler(complaintController.createComplaint)
);
router.get(
  '/my',
  authorize('student'),
  validate(complaintQuerySchema, 'query'),
  asyncHandler(complaintController.getMyComplaints)
);
router.get('/:id', authorize('student'), asyncHandler(complaintController.getComplaintById));
router.post(
  '/:id/comments',
  authorize('student'),
  validate(addComplaintCommentSchema),
  asyncHandler(complaintController.addComment)
);

export default router;
