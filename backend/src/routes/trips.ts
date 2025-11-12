import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as tripController from '../controllers/trips';
import * as itineraryController from '../controllers/tripItinerary';
import * as companionFinderController from '../controllers/companionFinder';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Trip CRUD routes
router.get('/', tripController.getUserTrips);
router.post('/', tripController.createTrip);
router.get('/:id', tripController.getTripById);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

// Trip companions routes
router.post('/:id/companions', tripController.inviteCompanion);
router.put('/:id/companions/respond', tripController.respondToInvitation);
router.delete('/:id/companions/:companionId', tripController.removeCompanion);

// Trip cities routes
router.post('/:id/cities', itineraryController.addCityToTrip);
router.put('/:id/cities/:cityId', itineraryController.updateTripCity);
router.delete('/:id/cities/:cityId', itineraryController.removeCityFromTrip);

// Trip itinerary routes
router.get('/:id/itinerary', itineraryController.getTripItinerary);
router.post('/:id/itinerary', itineraryController.addItineraryItem);
router.put('/:id/itinerary/:itemId', itineraryController.updateItineraryItem);
router.delete('/:id/itinerary/:itemId', itineraryController.deleteItineraryItem);

// Trip recommendations routes
router.post('/:id/recommendations', itineraryController.addRecommendationToTrip);
router.put('/:id/recommendations/:recId', itineraryController.updateTripRecommendation);
router.delete('/:id/recommendations/:recId', itineraryController.removeTripRecommendation);

// Trip comments routes
router.get('/:id/comments', itineraryController.getTripComments);
router.post('/:id/comments', itineraryController.addTripComment);
router.delete('/:id/comments/:commentId', itineraryController.deleteTripComment);

// Companion finder routes
router.get('/find/companions', companionFinderController.findTravelCompanions);
router.get('/discover/trips', companionFinderController.discoverPublicTrips);
router.get('/city/:cityId/users', companionFinderController.getUsersGoingToCity);
router.get('/suggested', companionFinderController.getSuggestedTrips);

export default router;
