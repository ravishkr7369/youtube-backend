import mongoose  from "mongoose"
import { Video } from "../models/video.model.js"
import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from 'cloudinary';



//✅
const getAllVideos = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

	//console.log("Query Params:", req.query)
	// Construct the filter object
	const filter = { isPublished: true };
	if (query) {
		filter.$or = [
			{ title: { $regex: query, $options: "i" } }, // Search by title or description
			{ description: { $regex: query, $options: "i" } },
		];
	}

	if (userId) {
		filter.owner = new mongoose.Types.ObjectId(userId);
	}

	// Define the sorting criteria
	const sort = {};
	sort[sortBy] = sortType === 'asc' ? 1 : -1;  // Sorting based on createdAt, views, etc.

	const skip = (parseInt(page) - 1) * parseInt(limit);

	try {
		// Aggregate for pagination, sorting, filtering, and populating specific owner fields
		const videos = await Video.aggregate([
			{ $match: filter }, // Apply filters
			{ $sort: sort },     // Apply sorting (e.g., by createdAt or views)
			{
				$lookup: {
					from: 'users', // The name of the collection to join
					localField: 'owner', // The field to match in the video collection
					foreignField: '_id', // The field to match in the user collection
					as: 'owner', // The name of the new array field to store the owner data
				},
			},

			// Only select the fields that are needed from the owner (email, name, profilePicture)
			{
				$project: {
					title: 1,
					description: 1,
					videoFile: 1,
					thumbnail: 1,
					duration: 1,
					views: 1,
					isPublished: 1,
					createdAt: 1,
					updatedAt: 1,
					'owner.username': 1,
					'owner.email': 1,
					'owner.avatar': 1,
				},
			},
			{ $skip: skip }, // Pagination: Skip the previous pages' results
			{ $limit: parseInt(limit) }, // Pagination: Limit the number of results
		]);

		// Get the total count of videos for pagination purposes
		const total = await Video.countDocuments(filter);

		return res.status(200).json(
			new ApiResponse(200, {
				videos,
				total,
				page: parseInt(page),
				totalPages: Math.ceil(total / limit),
			})
		);
	} catch (error) {
		throw new ApiError(500, "Internal server error", error.message);
	}
});


//✅
const publishAVideo = asyncHandler(async (req, res) => {
	const { title, description } = req.body;
	const videoLocalPath = req.files?.videoFile?.[0]?.path;
	const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

	if (!title || !description || !videoLocalPath || !thumbnailLocalPath) {
		throw new ApiError(400, "Title, description, video and thumbnail are required");
	}

	try {
		// Upload video and thumbnail to Cloudinary
		const videoData = await uploadOnCloudinary(videoLocalPath, "video");
		const thumbnailData = await uploadOnCloudinary(thumbnailLocalPath);

		if (!videoData?.url || !thumbnailData?.url) {
			throw new ApiError(500, "Upload to Cloudinary failed");
		}

		// Create video document in the database
		const video = await Video.create({
			title,
			description,
			videoFile: videoData.url,
			thumbnail: thumbnailData.url,
			duration: videoData.duration || 0,
			isPublished: true,  // Automatically published upon creation
			owner: req.user?._id,  // Assuming user ID is available from JWT
		});

		return res.status(201).json(
			new ApiResponse(201, video, "Video published successfully")
		);
	} catch (error) {
		console.error("Error publishing video:", error);
		throw new ApiError(500, "Something went wrong while publishing the video");
	}
});


//✅
const getVideoById = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	// Validate if the videoId is a valid MongoDB ObjectId
	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}

	try {
		// Aggregate query to fetch video and owner details
		const videos = await Video.aggregate([
			{ $match: { _id: new mongoose.Types.ObjectId(videoId) } },
			{
				$lookup: {
					from: 'users',
					localField: 'owner',
					foreignField: '_id',
					as: 'owner',
				},
			},
			{
				$project: {
					title: 1,
					description: 1,
					videoFile: 1,
					thumbnail: 1,
					duration: 1,
					isPublished: 1,
					createdAt: 1,
					updatedAt: 1,
					'owner.username': 1,
					'owner.email': 1,
					'owner.avatar': 1,
					'owner._id': 1,
				},
			},
		]);


		//console.log("Videos found:", videos);
		// If no videos are found, throw an error
		if (!videos||videos.length === 0) {
			return res.status(404).json({
				success: false,
				message: "Video not found with the provided ID",
			});
		}

		// Return the video data with a success message
		return res.status(200).json(
			new ApiResponse(200, videos[0], "Video fetched successfully")
		);
	} catch (error) {
	
		throw new ApiError(500, "Internal server error", error.message);
	}
});



//✅
const updateVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}


	if (!req.body) {
		throw new ApiError(400, "No data provided for update");
	}

	const { title, description } = req.body;
	let thumbnailUrl;

	try {
		const video = await Video.findById(videoId);
		if (!video) {
			throw new ApiError(404, "Video not found");
		}

		// 🔥 If a new thumbnail file is uploaded
		if (req.file?.path) {
			// Destroy old thumbnail from Cloudinary
			const oldThumbnailUrl = video.thumbnail;
			//	console.log(oldThumbnailUrl)
			const publicId = oldThumbnailUrl
				?.split("/")
				?.pop()
				?.split(".")[0]; // extract public_id from URL
			//	console.log(publicId)
			if (publicId) {
				await cloudinary.uploader.destroy(publicId, {
					resource_type: "image",
				});
			}

			// Upload new thumbnail
			const thumbnailData = await uploadOnCloudinary(req.file.path);
			if (!thumbnailData?.url) {
				throw new ApiError(500, "Upload to Cloudinary failed");
			}
			thumbnailUrl = thumbnailData.url;
		}

		// Ensure at least one field is updated
		if (!title && !description && !thumbnailUrl) {
			throw new ApiError(400, "At least one field (title, description, thumbnail) must be provided");
		}

		// Update fields
		if (title) video.title = title;
		if (description) video.description = description;
		if (thumbnailUrl) video.thumbnail = thumbnailUrl;

		await video.save();

		return res.status(200).json(
			new ApiResponse(200, video, "Video updated successfully")
		);
	} catch (error) {
		console.error("Error updating video:", error);
		throw new ApiError(500, "Internal server error", error.message);
	}
});



//✅
const deleteVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//console.log("Video ID:", videoId);

	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}

	try {
		// Find the video
		const video = await Video.findById(videoId);
		if (!video) {
			throw new ApiError(404, "Video not found");
		}

		
		const videoFilePublicId = video.videoFile ? video.videoFile.split("/").pop().split(".")[0] : null;
		const thumbnailFilePublicId = video.thumbnail ? video.thumbnail.split("/").pop().split(".")[0] : null;


		//console.log("Video file public ID:", videoFilePublicId);
		//console.log("Thumbnail public ID:", thumbnailFilePublicId);

		// Delete video and thumbnail from Cloudinary
		if (videoFilePublicId) {
			await cloudinary.uploader.destroy(videoFilePublicId, { resource_type: "video" });
		}

		if (thumbnailFilePublicId) {
			await cloudinary.uploader.destroy(thumbnailFilePublicId, { resource_type: "image" });
		}

		// Delete video from database using findByIdAndDelete (instead of .remove())
		await Video.findByIdAndDelete(videoId);

		return res.status(200).json(
			new ApiResponse(200, null, "Video deleted successfully")
		);
	} catch (error) {
		console.error("Error deleting video:", error);
		throw new ApiError(500, "Internal server error", error.message);
	}
});


//✅
const togglePublishStatus = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(videoId)) {	
		throw new ApiError(400, "Invalid video ID");
	}

	try {
		const video = await Video.findById(videoId);
		if (!video) {
			return res.status(404).json({
				success: false,
				message: "Video not found",
			});
		}

		video.isPublished = !video.isPublished;  // Toggle the status
		await video.save();

		return res.status(200).json(
			new ApiResponse(200, video, `Video ${video.isPublished ? 'published' : 'unpublished'} successfully`)
		);
	} catch (error) {
		throw new ApiError(500, "Internal server error", error.message);
	}
});


export {
	getAllVideos,
	publishAVideo,
	getVideoById,
	updateVideo,
	deleteVideo,
	togglePublishStatus
}