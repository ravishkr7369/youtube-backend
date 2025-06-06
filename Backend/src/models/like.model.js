
import mongoose, { Schema } from "mongoose";


const likeSchema = new Schema({
	video: {
		type: Schema.Types.ObjectId,
		ref: "Video"
	},
	comment: {
		type: Schema.Types.ObjectId,
		ref: "Comment"
	},
	reaction: { 
		type: String, 
		enum: ['like', 'dislike'], 
		required: true 
	},
	
	tweet: {
		type: Schema.Types.ObjectId,
		ref: "Tweet"
	},
	likedBy: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},

}, { timestamps: true })

export const Like = mongoose.model("Like", likeSchema)