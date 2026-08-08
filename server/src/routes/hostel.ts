import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as hostelController from '../controllers/hostelController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHostelSchema, updateHostelSchema, paginationSchema } from '../validators/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post(
  '/',
  authorize('admin'),
  validate(createHostelSchema),
  asyncHandler(hostelController.createHostel)
);
router.put(
  '/:id',
  authorize('admin'),
  validate(updateHostelSchema),
  asyncHandler(hostelController.updateHostel)
);
router.delete('/:id', authorize('admin'), asyncHandler(hostelController.deleteHostel));

// Admin and student can view
router.get(
  '/',
  authorize('admin', 'student'),
  validate(paginationSchema),
  asyncHandler(hostelController.getHostels)
);
router.get('/:id', authorize('admin', 'student'), asyncHandler(hostelController.getHostelById));
router.get(
  '/:id/rooms',
  authorize('admin', 'student'),
  asyncHandler(hostelController.getHostelRooms)
);
router.get('/:id/stats', authorize('admin'), asyncHandler(hostelController.getHostelStats));

export default router;
