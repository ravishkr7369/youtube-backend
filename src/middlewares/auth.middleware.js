import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";




export const jwtVerify = asyncHandler(async (req, _, next) => {
	try {
		const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "");

		if (!token) {

			throw new ApiError(401, "token not found")
		}

		const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
	
		
		const user = await User.findById(decodedToken?._id).select("-password -refreshToken -__v -createdAt -updatedAt");

		if (!user) {
			throw new ApiError(404, "Invalid access token")
		}
	
		req.user = user;
		
		next();
	}
	catch (error) {

		throw new ApiError(401, "Unauthorized access")
	}
})