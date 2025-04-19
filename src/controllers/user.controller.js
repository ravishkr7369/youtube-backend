import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const AccessAndRefreshToken = async (userId) => {
	const user = await User.findById(userId);
	const accessToken = await user.generateAccessToken();
	const refreshToken = await user.generateRefreshToken();
	user.refreshToken = refreshToken;
	await user.save({ validateBeforeSave: false }); // not validate the user again, as we are not changing any user data
	// save refresh token in db

	return { accessToken, refreshToken };
}

const userRegister = asyncHandler(async (req, res) => {

	// get user details from frontend
	// validation - not empty
	// check if user already exists: username, email
	// check for images, check for avatar
	// upload them to cloudinary, avatar
	// create user object - create entry in db
	// remove password and refresh token field from response
	// check for user creation
	// return res


	const { email, password, username, fullName } = req.body;
	if ([email, password, username, fullName].some((field) => field?.trim() === "")) {
		throw new ApiError(400, "All fields are required");
	}

	const existedUser = await User.findOne({
		$or: [{ email }, { username }]
	});
	if (existedUser) {
		throw new ApiError(409, "User already exists")
	}

	let avatarLocalPath;
	if (req.files && Array.isArray(req.files?.avatar) && req.files?.avatar.length > 0) {
		avatarLocalPath = req.files.avatar[0].path;

	} else {
		throw new ApiError(400, "Avatar file is required")
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);
	if (!avatar) {
		throw new ApiError(400, "Error uploading avatar to cloudinary")
	}

	let coverImageLocalPath;
	if (req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
		coverImageLocalPath = req.files.coverImage[0].path;

	}
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	const user = await User.create({
		username: username.toLowerCase(),
		email,
		password,
		fullName,
		avatar: avatar.url,
		coverImage: coverImageLocalPath ? coverImage.url : null,
	});

	const newUser = await User.findById(user._id).select("-password -refreshToken -__v -createdAt -updatedAt");
	if (!newUser) {
		throw new ApiError(500, "Something went wrong while creating user")
	}

	return res.status(201).json(
		new ApiResponse(newUser, 200, "User created successfully")

	);



})


const userLogin = asyncHandler(async (req, res) => {
	// get user details from frontend
	// validation - not empty
	// check if user already exists: username, email
	// check for password match
	// create access token and refresh token
	// save refresh token in db
	// remove password and refresh token field from response		
	// return res

	const { email, password, username } = req.body;
	if (!(username || password || email)) {
		throw new ApiError(400, "All fields are required")
	}

	const user = await User.findOne({
		$or: [{ email }, { username }]
	});

	if (!user) {
		throw new ApiError(404, "User does not exist")
	}

	const isPasswordValid = user.isPasswordCorrect(password);
	if (!isPasswordValid) {
		throw new ApiError(401, "Invalid user credentials")
	}

	const { accessToken, refreshToken } = await AccessAndRefreshToken(user._id);
	const loggedInUser = await User.findById(user._id).select("-password -refreshToken -__v -createdAt -updatedAt");

	const options = {
		httpOnly: true,
		secure: true,
	}


	return res.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new ApiResponse(200,
				{
					user: loggedInUser, accessToken, refreshToken
				},

				"User logged in successfully")
		);

})

const userLogout = asyncHandler(async (req, res) => {

	//console.log(req.user._id)
	try {
		await User.findByIdAndUpdate(req.user._id,
			{
				$unset: {
					refreshToken: 1
				}
			},
			{
				new: true,
			}
		)

		const options = {
			httpOnly: true,
			secure: true,

		}

		return res.status(200)
			.clearCookie("accessToken", options)
			.clearCookie("refreshToken", options)
			.json(
				new ApiResponse(200, {}, 'User logged out successfully')
			);

	} catch (error) {
		throw new ApiError(500, "Something went wrong while logging out user")

	}



})

const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

	if (!incomingRefreshToken) {
		throw new ApiError(401, "Unauthorized access")
	}
	try {
		const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);


		const user = await User.findById(decodedToken?._id);
		if (!user) {
			throw new ApiError(404, "Invalid refresh token")
		}

		//console.log(user.refreshToken + " " + incomingRefreshToken)
		if (user?.refreshToken !== incomingRefreshToken) {
			throw new ApiError(401, "Refresh token is expired or used")
		}

		const { accessToken, refreshToken } = await AccessAndRefreshToken(user._id);

		const options = {
			httpOnly: true,
			secure: true,
		}

		return res.status(200)
			.cookie("accessToken", accessToken, options)
			.cookie("refreshToken", refreshToken, options)
			.json(
				new ApiResponse(200,
					{
						accessToken, refreshToken
					},

					"Access token refreshed successfully")
			);


	} catch (error) {
		throw new ApiError(401, error?.message || "Unauthorized access")
	}
})


const changeOldPassword = asyncHandler(async (req, res) => {
	const { oldPassword, newPassword } = req.body;

	//console.log(oldPassword, newPassword)
	try {
		if (!oldPassword || !newPassword) {
			throw new ApiError(400, "All fields are required")
		}
		const user = await User.findById(req.user?._id);

		const isPasswordValid = await user.isPasswordCorrect(oldPassword);
		if (!isPasswordValid) {
			throw new ApiError(400, "Invalid old password")
		}
		user.password = newPassword;
		await user.save({ validateBeforeSave: false });
		return res
			.status(200)
			.json(new ApiResponse(200, {}, "Password changed successfully"))
	} catch (error) {
		throw new ApiError(500, "Something went wrong while changing password")
	}

})


const currentUser = asyncHandler(async (req, res) => {
	return res
		.status(200)
		.json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateUserDetails = asyncHandler(async (req, res) => {


	const { fullName, email } = req.body;
	try {


		if (!fullName || !email) {
			throw new ApiError(400, "All fields are required")
		}


		const user = await User.findByIdAndUpdate(req.user?._id,
			{
				$set: {
					fullName,
					email: email
				}
			},
			{
				new: true,
			},
			{ new: true },
		).select("-password -refreshToken -__v -createdAt -updatedAt");


		return res
			.status(200)
			.json(new ApiResponse(200, user, "User details updated successfully"))

	} catch (error) {

	}
})

const updateUserAvatar = asyncHandler(async (req, res) => {
	const avatarLocalPath = req.file?.path;
	//console.log(req.file)
	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is missing")
	}
	try {
		const avatar = await uploadOnCloudinary(avatarLocalPath);
		// console.log(avatar.url)
		if (!avatar.url) {
			throw new ApiError(400, "Error uploading avatar to cloudinary")
		}

		const user = await User.findByIdAndUpdate(req.user?._id,
			{
				$set: {
					avatar: avatar.url
				}
			},
			{
				new: true,
			},
			{ new: true },
		).select("-password -refreshToken -__v -createdAt -updatedAt");

		return res
			.status(200)
			.json(new ApiResponse(200, user, "Avatar updated successfully"))

	} catch (error) {
		throw new ApiError(500, "Something went wrong while updating avatar")
	}


})

const updateUserCoverImage = asyncHandler(async (req, res) => {
	const coverImageLocalPath = req.file?.path;
	if (!coverImageLocalPath) {
		throw new ApiError(400, "Avatar file is missing")
	}
	try {
		const coverImage = await uploadOnCloudinary(coverImageLocalPath);
		if (!coverImage.url) {
			throw new ApiError(400, "Error uploading avatar to cloudinary")
		}

		const user = await User.findByIdAndUpdate(req.user?._id,
			{
				$set: {
					coverImage: coverImage.url
				}
			},
			{
				new: true,
			},
			{ new: true },
		).select("-password -refreshToken -__v -createdAt -updatedAt");

		return res
			.status(200)
			.json(new ApiResponse(200, user, "coverImage updated successfully"))

	} catch (error) {
		throw new ApiError(500, "Something went wrong while updating coverImage")
	}


})



const getUserChannelProfile = asyncHandler(async (req, res) => {
	const { username } = req.params;
	if (!username.trim()) {
		throw new ApiError(400, "Username is missing");
	}

	try {
		// console.log(req.user._id)
		const currentUserId = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;
		// console.log(currentUserId);
	

		const channel = await User.aggregate([
			{ $match: { username: username.toLowerCase() } },
			{
				$lookup: {
					from: "subscriptions",
					localField: "_id",
					foreignField: "channel",
					as: "subscribers"
				}
			},
			{
				$lookup: {
					from: "subscriptions",
					localField: "_id",
					foreignField: "subscriber",
					as: "subscribedTo"
				}
			},
			{
				$addFields: {
					subscribersCount: { $size: "$subscribers" },
					channelsSubscribedToCount: { $size: "$subscribedTo" }
				
				}
			},
			{
				$project: {
					username: 1,
					fullName: 1,
					email: 1,
					avatar: 1,
					coverImage: 1,
					subscribersCount: 1,
					channelsSubscribedToCount: 1,
					subscribers: 1 // Keep this to check subscription in JS
				}
			}
		]);

		if (!channel?.length) {
			throw new ApiError(404, "Channel not found");
		}

		const channelData = channel[0];

		
		const isSubscribed = channelData.subscribers.some(sub => {
			return sub.subscriber.toString() === currentUserId?.toString();
		});

		// Remove subscribers array before sending response
		delete channelData.subscribers;

		// console.log(channelData)
		return res.status(200).json(new ApiResponse(200, {
			...channelData,
			isSubscribed
		}, "User Channel fetched successfully"));
	} catch (error) {
		console.error("Error fetching channel profile:", error);
		throw new ApiError(500, "Something went wrong while fetching channel profile");
	}
});



const getWatchHistory = asyncHandler(async (req, res) => {
	const user = await User.aggregate([
		{ $match: { _id: new mongoose.Types.ObjectId(req.user?._id) } },
		{
			$lookup: {
				from: "videos",
				localField: "watchHistory",
				foreignField: "_id",
				as: "watchHistory",
				pipeline: [{
					$lookup: {
						from: "users",
						localField: "user",
						foreignField: "_id",
						as: "owner",
						pipeline: [{
							$project: {
								username: 1,
								fullName: 1,
								avatar: 1
							}
						}]
					}
				}, {
					$addFields: {
						owner: {
							$first: "$owner"
						}
					}
				}]
			}
		},

	])

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				user[0].watchHistory,
				"Watch history fetched successfully"
			)
		)

})


export {
	userRegister,
	userLogin,
	userLogout,
	refreshAccessToken,
	changeOldPassword,
	currentUser,
	updateUserDetails,
	updateUserAvatar,
	updateUserCoverImage,
	getUserChannelProfile,
	getWatchHistory
}