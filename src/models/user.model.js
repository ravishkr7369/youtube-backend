import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			index: true,
			trim: true,
			lowercase: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		fullName: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		avatar: {
			type: String,
			required: true
		},
		coverImage: {
			type: String,

		},
		watchHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: "Video",
			}
		],
		password: {
			type: String,
			required: [true, 'Password is required'],
		},
		refreshToken: {
			type: String,
		}
	},

	{ timestamps: true }

);

userSchema.pre("save", async function (next) {// password set before the user is saved

	if (this.isModified("password")) {
		this.password = await bcrypt.hash(this.password, 10);

	}
	next();

});

userSchema.methods.isPasswordCorrect = async function (password) {
	return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
	return jwt.sign({
		_id: this.id,
		username: this.username,
		email: this.email,
		fullName: this.fullName,
	},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		})
}

userSchema.methods.generateRefreshToken = function () {
	return jwt.sign({
		_id: this.id,
	},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		})
}

const User = mongoose.model("User", userSchema);
export default User;