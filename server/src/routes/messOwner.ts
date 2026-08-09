import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as messOwnerController from '../controllers/messOwnerController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createMessSchema,
  updateMessSchema,
  updateMenuSchema,
  menuDayParamSchema,
  subscriptionActionSchema,
} from '../validators/index.js';

const router = Router();

// Every mess-owner endpoint requires an authenticated mess_owner.
router.use(authenticate);
router.use(authorize('mess_owner'));

// Profile
router.post('/me', validate(createMessSchema), asyncHandler(messOwnerController.createMyMess));
router.get('/me', asyncHandler(messOwnerController.getMyMess));
router.put('/me', validate(updateMessSchema), asyncHandler(messOwnerController.updateMyMess));

// Weekly menu
router.put(
  '/menu/:dayOfWeek',
  validate(menuDayParamSchema, 'params'),
  validate(updateMenuSchema),
  asyncHandler(messOwnerController.upsertMenu)
);
router.delete(
  '/menu/:dayOfWeek',
  validate(menuDayParamSchema, 'params'),
  asyncHandler(messOwnerController.deleteMenu)
);

// Subscription requests
router.get('/requests', asyncHandler(messOwnerController.getRequests));
router.post('/subscriptions/:id/accept', asyncHandler(messOwnerController.acceptSubscription));
router.post(
  '/subscriptions/:id/reject',
  validate(subscriptionActionSchema),
  asyncHandler(messOwnerController.rejectSubscription)
);

// Subscribers & stats
router.get('/subscribers', asyncHandler(messOwnerController.getSubscribers));
router.get('/stats', asyncHandler(messOwnerController.getStats));

export default router;
