import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


//✅
const getVideoComments = asyncHandler(async (req, res) => {
	//TODO: get all comments for a video
	const { videoId } = req.params
	const page=parseInt(req.query.page) || 1
	const limit=parseInt(req.query.limit) || 10
	//console.log(page)

	if(!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID")
	}

	const video = await Video.findById(videoId)
	if(!video) {
		throw new ApiError(404, "Video not found")
	}

	const comments = await Comment.find({ video: videoId })
		.populate("owner", "username avatar")
		.skip((page - 1) * limit)
		.limit(limit)
		.sort({ createdAt: -1 })

		//console.log(comments)
	 const totalComments = await Comment.countDocuments({ video: videoId })

	 return res.status(200).json(
		new ApiResponse(200, {
			comments,
			totalComments,
			page: parseInt(page),
			limit: parseInt(limit),
		}, "Comments fetched successfully")
	)
	

})


//✅
const addComment = asyncHandler(async (req, res) => {
	// TODO: add a comment to a video
	const { videoId } = req.params
	const { _id } = req.user
	const { text } = req.body

	// Validate the video ID
	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID")
	}

	// Find the video by ID
	const video = await Video.findById(videoId)
	if (!video) {
		throw new ApiError(404, "Video not found")
	}

	// Create a new comment
	const comment = await Comment.create({
		video: videoId,
		owner: _id,
		content: text,
	});

	// Get the count of comments for the video
	const commentCount = await Comment.countDocuments({ video: videoId })

	// You can send a response here with the comment and commentCount (if needed)
	// For example:
	return res.status(200).json(
		new ApiResponse(200, { comment,commentCount }, "Comment added successfully")
	)
});



//✅
const updateComment = asyncHandler(async (req, res) => {
	// TODO: update a comment
	const { commentId } = req.params
	const { _id } = req.user
	const { text } = req.body

	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, "Invalid comment ID")
	}

	const comment = await Comment.findById(commentId)
	if (!comment) {
		throw new ApiError(404, "Comment not found")
	}

	if (comment.owner.toString() !== _id.toString()) {
		throw new ApiError(403, "You are not authorized to update this comment")
	}

	comment.content = text
	await comment.save()

	return res.status(200).json(
		new ApiResponse(200, comment, "Comment updated successfully")
	)

})


//✅
const deleteComment = asyncHandler(async (req, res) => {
	// TODO: delete a comment

	const { commentId } = req.params
	const { _id } = req.user
	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, "Invalid comment ID")
	}

	const comment = await Comment.findById(commentId)
	if (!comment) {
		throw new ApiError(404, "Comment not found")
	}
	if( comment.owner.toString() !== _id.toString()) {
		throw new ApiError(403, "You are not authorized to delete this comment")
	}
	await comment.deleteOne()

	return res.status(200).json(
		new ApiResponse(200, null, "Comment deleted successfully")
	)

})

export {
	getVideoComments,
	addComment,
	updateComment,
	deleteComment
}