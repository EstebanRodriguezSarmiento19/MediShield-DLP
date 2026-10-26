import { Router } from 'express';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import healthController from './health.controller.js';

const router = Router();

router.get('/', asyncHandler(healthController.getHealth));

export default router;
