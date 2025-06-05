import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({
	path: '../.env'
});



cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {

		try {
			if(!localFilePath) return null;
			const file=await cloudinary.uploader.upload(localFilePath,{
				resource_type: 'auto',
			});

			
			if (fs.existsSync(localFilePath)) {
			
			fs.unlinkSync(localFilePath);
			}


			return file;
			
		} catch (error) {
			console.log("Error uploading file to Cloudinary", error);
			if (fs.existsSync(localFilePath)) {
				fs.unlinkSync(localFilePath);
			}
			return null;
		}


	}


	export {uploadOnCloudinary}
	