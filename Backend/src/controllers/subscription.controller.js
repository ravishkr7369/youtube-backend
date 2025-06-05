import mongoose, { isValidObjectId } from "mongoose"
import  User  from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


//✅
// controller to check if a user is subscribed to a channel
const checkSubscriptionStatus = asyncHandler(async (req, res) => {
	const { channelId } = req.params;
	const subscriberId = req.user?._id;

	if (!mongoose.Types.ObjectId.isValid(channelId)) {
		throw new ApiError(400, "Invalid channel ID");
	}

	if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
		throw new ApiError(400, "Invalid subscriber ID");
	}

	const subscription = await Subscription.findOne({
		channel: channelId,
		subscriber: subscriberId,
	});

	//console.log("Subscription found:", subscription);
	return res.status(200).json(
		new ApiResponse(200, { isSubscribed: !!subscription }, "Subscription status fetched")
	);
});


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

	if (subscriberId.toString() === channelId) {
		throw new ApiError(400, "You cannot subscribe to your own channel");
	}
	

	// Check if the subscription already exists 
	const existingSubscription = await Subscription.findOne({
		subscriber: subscriberId,
		channel: channelId
	});

	// If subscription exists, unsubscribe the user
	if (existingSubscription) {
		await Subscription.deleteOne({ _id: existingSubscription._id });

		return res.status(200).json(new ApiResponse(200, { isSubscribed:false }, "Unsubscribed successfully"));
	}

	// If subscription does not exist, subscribe the user
	const newSubscription = new Subscription({
		subscriber: subscriberId,
		channel: channelId
	});

	await newSubscription.save();

	return res.status(200).json(new ApiResponse(200, { isSubscribed: true}, "Subscribed successfully"));
});



//✅
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
	const { channelId } = req.params;
	const userId = req.user?._id;

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

	// Count subscribers
	const subscriberCount = await Subscription.countDocuments({ channel: channelId });

	// Get subscribers array (with user info)
	const subscribers = await Subscription.find({ channel: channelId })
		.populate("subscriber", "username fullName avatar") // select only needed fields
		.select("-channel -__v"); // remove unneeded fields

	// Format subscribers as array of user info
	const subscriberUsers = subscribers.map(sub => sub.subscriber);

	return res.status(200).json(
		new ApiResponse(200, {
			channelId,
			subscriberCount,
			subscribers: subscriberUsers, // array of users who subscribed
			requestedBy: userId
		}, "Subscriber list fetched successfully")
	);
});



//✅
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
	const { subscriberId } = req.params;
// console.log("Subscriber ID:", subscriberId);
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
	checkSubscriptionStatus,
	toggleSubscription,
	getUserChannelSubscribers,
	getSubscribedChannels
}