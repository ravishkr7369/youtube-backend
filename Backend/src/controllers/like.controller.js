import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"



//✅
const getLikedCount = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}
	const likeCount = await Like.countDocuments({ video: videoId, reaction: "like" });
	const dislikeCount = await Like.countDocuments({ video: videoId, reaction: "dislike" });
	const userId = req.user._id;
	const reaction = await Like.findOne({ video: videoId, likedBy: userId });

	return res.status(200).json(
		new ApiResponse(200, {
			likeCount,
			dislikeCount,
			isLiked: reaction?.reaction === "like",
			isDisliked: reaction?.reaction === "dislike",
		})
	);
});

//✅
const toggleReaction = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	const { reactionType } = req.body; // 'like' or 'dislike'
	const userId = req.user._id;

	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}

	if (!['like', 'dislike'].includes(reactionType)) {
		throw new ApiError(400, "Invalid reaction type");
	}

	const video = await Video.findById(videoId);
	if (!video) {
		throw new ApiError(404, "Video not found");
	}

	// Find if user already reacted on this video
	const existingReaction = await Like.findOne({ video: videoId, likedBy: userId });

	if (!existingReaction) {
		// No reaction before, create new with reactionType
		await Like.create({ video: videoId, likedBy: userId, reaction: reactionType });
	} else {
		if (existingReaction.reaction === reactionType) {
			// Same reaction, remove it (toggle off)
			await existingReaction.deleteOne();
		} else {
			// Different reaction, update it
			existingReaction.reaction = reactionType;
			await existingReaction.save();
		}
	}

	// Calculate counts of likes and dislikes
	const likeCount = await Like.countDocuments({ video: videoId, reaction: 'like' });
	const dislikeCount = await Like.countDocuments({ video: videoId, reaction: 'dislike' });

	// Get current user reaction status
	const updatedReaction = await Like.findOne({ video: videoId, likedBy: userId });

	return res.status(200).json(new ApiResponse(200, {
		likeCount,
		dislikeCount,
		isLiked: updatedReaction?.reaction === 'like',
		isDisliked: updatedReaction?.reaction === 'dislike',
	}, "Reaction updated successfully"));
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
	getLikedCount,
	toggleReaction,
	toggleCommentLike,
	toggleTweetLike,
	getLikedVideos,
	
	
}