import express from 'express';
import { getCountries, getProvinces, getStates, getCounties, getCities } from '../controllers/geoController.js';

const router = express.Router();

// Live Countries endpoint (All world countries, flags, phone codes)
router.get('/countries', getCountries);

// Live States / Provinces endpoint (dynamically loaded for any country)
router.get('/provinces', getProvinces);
router.get('/states', getStates);
router.get('/states/:countryCode', getStates);

// Live Counties endpoint
router.get('/counties', getCounties);

// Live Cities endpoint
router.get('/cities', getCities);

export default router;
