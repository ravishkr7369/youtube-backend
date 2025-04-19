import { Router } from 'express';
import {
	addComment,
	deleteComment,
	getVideoComments,
	updateComment,
} from "../controllers/comment.controller.js"
import { jwtVerify } from "../middlewares/auth.middleware.js"

const router = Router();


router.get("/:videoId", jwtVerify, getVideoComments)
router.post("/:videoId", jwtVerify, addComment)
router.delete("/c/:commentId", jwtVerify, deleteComment)
router.patch("/c/:commentId", jwtVerify,updateComment);

export default router