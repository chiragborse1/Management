import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as messController from '../controllers/messController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { messQuerySchema, menuQuerySchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Mess browsing (all authenticated roles)
router.get(
  '/',
  authorize('student', 'admin', 'mess_owner'),
  validate(messQuerySchema, 'query'),
  asyncHandler(messController.listMesses)
);
router.get(
  '/:id',
  authorize('student', 'admin', 'mess_owner'),
  asyncHandler(messController.getMessById)
);

// Menus
router.get(
  '/:id/menu/today',
  authorize('student', 'admin', 'mess_owner'),
  asyncHandler(messController.getMessMenuToday)
);
router.get(
  '/:id/menu/week',
  authorize('student', 'admin', 'mess_owner'),
  asyncHandler(messController.getMessWeeklyMenu)
);
router.get(
  '/:id/menu',
  authorize('student', 'admin', 'mess_owner'),
  validate(menuQuerySchema, 'query'),
  asyncHandler(messController.getMessMenuByDay)
);

export default router;
