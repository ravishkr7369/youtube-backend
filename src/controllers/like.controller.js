import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


//✅
const toggleVideoLike = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}

	//console.log(req.user)

	const { _id } = req.user;


	// Check if the video exists
	const video = await Video.findById(videoId);
	if (!video) {
		throw new ApiError(404, "Video not found");
	}

	// Check if like already exists

	const existingLike = await Like.findOne({
		video: videoId,
		likedBy: _id
	});

	//console.log("existingLike", existingLike)

	let message;

	if (existingLike) {
		// Unlike the video (remove the like)
		await existingLike.deleteOne();
		message = "Video unliked successfully";
	} else {
		// Like the video
		await Like.create({
			video: videoId,
			likedBy: _id
		});
		message = "Video liked successfully";
	}

	const likeCount = await Like.countDocuments({ video: videoId });

	return res.status(200).json(
		new ApiResponse(200, { likeCount }, message)
	);
});


//✅
const toggleCommentLike = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
	const { _id } = req.user;

	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, "Invalid comment ID");
	}

	const comment = await Comment.findById(commentId);
	if (!comment) {
		throw new ApiError(404, "Comment not found");
	}

	const existingCommentLike = await Like.findOne({
		comment: commentId,
		likedBy: _id
	});

	let message;
	if (existingCommentLike) {
		await existingCommentLike.deleteOne();
		message = "Comment unliked successfully";
	} else {
		await Like.create({
			comment: commentId,
			likedBy: _id
		});
		message = "Comment liked successfully";
	}

	const likeCount = await Like.countDocuments({ comment: commentId });

	return res.status(200).json(
		new ApiResponse(200, { likeCount }, message)
	);
});



//❌
const toggleTweetLike = asyncHandler(async (req, res) => {
	const { tweetId } = req.params
	//TODO: toggle like on tweet
}
)



//✅
const getLikedVideos = asyncHandler(async (req, res) => {
	//TODO: get all liked videos

	const { _id } = req.user

	const likedVideos = await Like.find({ likedBy: _id, video: { $exists: true } })
		.populate("video", "title thumbnail")
		.select("-_id -__v -likedBy")
		.sort({ createdAt: -1 });

	const likedVideosCnt = await Like.countDocuments({ likedBy: _id, video: { $exists: true } });


	return res.status(200).json(
		new ApiResponse(200, { likedVideos, likedVideosCnt }, "Liked videos fetched successfully")
	);


})

//console.log(likedVideos)





export {
	toggleCommentLike,
	toggleTweetLike,
	toggleVideoLike,
	getLikedVideos
}