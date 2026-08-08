import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as roomController from '../controllers/roomController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createRoomSchema,
  updateRoomSchema,
  allocateRoomSchema,
  paginationSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Admin only
router.post(
  '/',
  authorize('admin'),
  validate(createRoomSchema),
  asyncHandler(roomController.createRoom)
);
router.put(
  '/:id',
  authorize('admin'),
  validate(updateRoomSchema),
  asyncHandler(roomController.updateRoom)
);
router.delete('/:id', authorize('admin'), asyncHandler(roomController.deleteRoom));
router.post(
  '/:id/allocate',
  authorize('admin'),
  validate(allocateRoomSchema),
  asyncHandler(roomController.allocateRoom)
);
router.post('/:id/deallocate', authorize('admin'), asyncHandler(roomController.deallocateRoom));

// Admin and student can view
router.get(
  '/',
  authorize('admin', 'student'),
  validate(paginationSchema, 'query'),
  asyncHandler(roomController.getRooms)
);
router.get('/:id', authorize('admin', 'student'), asyncHandler(roomController.getRoomById));
router.get(
  '/hostel/:hostelId',
  authorize('admin', 'student'),
  asyncHandler(roomController.getRoomsByHostel)
);
router.get(
  '/:id/availability',
  authorize('admin', 'student'),
  asyncHandler(roomController.checkAvailability)
);

export default router;
