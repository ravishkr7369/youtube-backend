import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async () => {
	try {
		
		const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

		// const connectionInstance = await mongoose.connect(`mongodb+srv://ravishkr7369:hVLelpw5WZaPjWqB@cluster0.1fye8.mongodb.net/${DB_NAME}`);

		console.log("MongoDB connected successfully:", connectionInstance.connection.host);
	} catch (error) {
		console.log("Error connecting to MongoDB:", error.message);
		process.exit(1);
	}
}

export default connectDB;
