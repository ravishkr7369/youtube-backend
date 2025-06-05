import { Router } from 'express';
import {
	deleteVideo,
	getAllVideos,
	getVideoById,
	publishAVideo,
	togglePublishStatus,
	updateVideo,
} from "../controllers/video.controller.js"
import {jwtVerify}  from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();


// Note: This route is not protected, so it can be accessed without authentication
router.get("/",getAllVideos); // Get all videos, 
router.get("/:videoId", getVideoById); // Get video by ID


router.use(jwtVerify); // Apply verifyJWT middleware to all routes in this file

router
	.route("/")
	.post(
		upload.fields([
			{
				name: "videoFile",
				maxCount: 1,
			},
			{
				name: "thumbnail",
				maxCount: 1,
			},

		]),
		publishAVideo
	);

router
	.route("/:videoId")
	.delete(deleteVideo)
	.patch(upload.single("thumbnail"), updateVideo);

router.route("/publish/:videoId").patch(togglePublishStatus);

export default router