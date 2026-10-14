import express from 'express';
import { getCountries, getStates } from '../controllers/geoController.js';

const router = express.Router();

// Live Countries endpoint (All world countries, flags, phone codes)
router.get('/countries', getCountries);

// Live States / Provinces endpoint (dynamically loaded for any country)
router.get('/states', getStates);
router.get('/states/:countryCode', getStates);

export default router;
