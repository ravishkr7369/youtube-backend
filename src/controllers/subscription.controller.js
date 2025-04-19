import mongoose, { isValidObjectId } from "mongoose"
import  User  from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//✅
const toggleSubscription = asyncHandler(async (req, res) => {
	const { channelId } = req.params;// another user Id
	const subscriberId = req.user?._id;  // logged in user Id


	if (!mongoose.Types.ObjectId.isValid(channelId)) {
		throw new ApiError(400, "Invalid channel ID");
	}

	if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
		throw new ApiError(400, "Invalid subscriber ID");
	}

	
	const channel = await User.findById(channelId);
	if (!channel) {
		throw new ApiError(404, "Channel not found");
	}

	// Check if the subscription already exists 
	const existingSubscription = await Subscription.findOne({
		subscriber: subscriberId,
		channel: channelId
	});

	// If subscription exists, unsubscribe the user
	if (existingSubscription) {
		await Subscription.deleteOne({ _id: existingSubscription._id });

		return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"));
	}

	// If subscription does not exist, subscribe the user
	const newSubscription = new Subscription({
		subscriber: subscriberId,
		channel: channelId
	});

	await newSubscription.save();

	return res.status(200).json(new ApiResponse(200, {}, "Subscribed successfully"));
});

//✅
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
	const { channelId } = req.params;
	const userId = req.user?._id; // Logged-in user ID

	if (!mongoose.Types.ObjectId.isValid(channelId)) {
		throw new ApiError(400, "Invalid channel ID");
	}

	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError(400, "Invalid user ID");
	}

	
	const channel = await User.findById(channelId);
	if (!channel) {
		throw new ApiError(404, "Channel not found");
	}

	
	const subscriberCount = await Subscription.countDocuments({ channel: channelId });

	return res.status(200).json(
		new ApiResponse(200, { channelId, subscriberCount }, "Subscriber count fetched successfully")
	);
});


//✅
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
	const { subscriberId } = req.params;

	if (req.user._id.toString() !== subscriberId) {
		throw new ApiError(403, "You are not authorized to view this subscriber's channels");
	}

	// Validate ObjectId format
	if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
		throw new ApiError(400, "Invalid subscriber ID");
	}

	// Check if the subscriber exists
	const subscriber = await User.findById(subscriberId);
	if (!subscriber) {
		throw new ApiError(404, "Subscriber not found");
	}

	// Fetch subscriptions
	const subscriptions = await Subscription.aggregate([
		{ $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
		{
			$lookup: {
				from: "users",
				localField: "channel",
				foreignField: "_id",
				as: "channelDetails"
			}
		},
		
		{
			$project: {
				_id: 0,
				channel: "$channelDetails._id",
				username: "$channelDetails.username",
				fullName: "$channelDetails.fullName",
				avatar: "$channelDetails.avatar",
				coverImage: "$channelDetails.coverImage"
			}
		}
	]);

	return res
		.status(200)
		.json(new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully"));
});



export {
	toggleSubscription,
	getUserChannelSubscribers,
	getSubscribedChannels
}