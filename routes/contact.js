import express from 'express';
import { handleContact } from '../controllers/contactController.js';

const router = express.Router();

// Maps to POST http://localhost:5000/api/contact
router.post('/', handleContact);

export default router;