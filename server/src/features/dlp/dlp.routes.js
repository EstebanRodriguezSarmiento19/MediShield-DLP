import { Router } from 'express';
import { analyze, recent, rules, stats } from './dlp.controller.js';

const router = Router();

router.post('/analyze', analyze);
router.get('/stats', stats);
router.get('/recent', recent);
router.get('/rules', rules);

export default router;
