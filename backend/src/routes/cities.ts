import { Router } from 'express';
import { getCityDetails, getAllCities } from '../controllers/cities';

const router = Router();

// Get all cities
router.get('/', getAllCities);

// Get specific city with recommendations
router.get('/:cityName', getCityDetails);

export default router;
