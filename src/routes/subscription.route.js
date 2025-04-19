import { Router } from 'express';
import {
	getSubscribedChannels,
	getUserChannelSubscribers,
	toggleSubscription,
} from "../controllers/subscription.controller.js"
import { jwtVerify } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(jwtVerify); // Apply verifyJWT middleware to all routes in this file

router
	.route("/c/:channelId")
	.post(toggleSubscription) // Subscribe or unsubscribe to the channel
	.get(getUserChannelSubscribers); // Get all the subscribers of the channel


router.route("/u/:subscriberId").get(getSubscribedChannels)

export default router