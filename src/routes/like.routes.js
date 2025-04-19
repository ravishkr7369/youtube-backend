import { Router } from 'express';
import {
	getLikedVideos,
	toggleCommentLike,
	toggleVideoLike,
	toggleTweetLike,
} from "../controllers/like.controller.js"
import { jwtVerify } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(jwtVerify); // Apply verifyJWT middleware to all routes in this file

router.post("/toggle/v/:videoId", toggleVideoLike);
router.post("/toggle/c/:commentId", toggleCommentLike)
router.post("/toggle/t/:tweetId", toggleTweetLike)
router.get("/videos", getLikedVideos)

export default router