import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//✅
const createPlaylist = asyncHandler(async (req, res) => {
	const { name, description } = req.body

	//TODO: create playlist
	const owner= req.user._id
	const playlist = await Playlist.create({
		name,
		description,
		owner
	})
	if (!playlist) {
		throw new ApiError(400, "Playlist not created")
	}

	return res.status(200).json(
		new ApiResponse(200, playlist,"Playlist created successfully")
	)
})

//✅
const getUserPlaylists = asyncHandler(async (req, res) => {
	
	const { userId } = req.params
	
	//TODO: get user playlists
	if(!mongoose.Types.ObjectId.isValid(userId)){
		throw new ApiError(400, "Invalid user id")
	}
	const playlists = await Playlist.find({ owner: userId }).populate("videos")
	// console.log(playlists)
	if (!playlists) {
		throw new ApiError(404, "Playlists not found")
	}
	return res.status(200).json(
		new ApiResponse(200, playlists,"Playlists fetched successfully")
	)
})

//✅
const getPlaylistById = asyncHandler(async (req, res) => {
	//TODO: get playlist by id
	const { playlistId } = req.params

	if(!mongoose.Types.ObjectId.isValid(playlistId)){	
		throw new ApiError(400, "Invalid playlist id")
	}
	const playlist = await Playlist.findById(playlistId).populate("videos")
	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}


	return res.status(200).json(
		new ApiResponse(200, playlist,"Playlist fetched successfully")
	)

	
})


//✅
const addVideoToPlaylist = asyncHandler(async (req, res) => {

	const { playlistId, videoId } = req.params

	if(!mongoose.Types.ObjectId.isValid(playlistId)){	
		throw new ApiError(400, "Invalid playlist id")
	}
	if(!mongoose.Types.ObjectId.isValid(videoId)){	
		throw new ApiError(400, "Invalid video id")
	}

	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}

	const videoExists = playlist.videos.some((video) => video.toString() === videoId)
	if (videoExists) {
		throw new ApiError(400, "Video already exists in playlist")
	}

	playlist.videos.push(videoId)
	await playlist.save()

	return res.status(200).json(
		new ApiResponse(200, playlist,"Video added to playlist successfully")
	)

})

//✅
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params
	// TODO: remove video from playlist

	if(!mongoose.Types.ObjectId.isValid(playlistId)){
		throw new ApiError(400, "Invalid playlist id")
	}	
	if(!mongoose.Types.ObjectId.isValid(videoId)){
		throw new ApiError(400, "Invalid video id")
	}
	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}
	const videoExists = playlist.videos.some((video) => video.toString() === videoId)
	if (!videoExists) {
		throw new ApiError(400, "Video does not exist in playlist")
	}
	playlist.videos = playlist.videos.filter((video) => video.toString() !== videoId)
	await playlist.save()
	return res.status(200).json(
		new ApiResponse(200, playlist,"Video removed from playlist successfully")
	)

})


//✅
const deletePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params
	// TODO: delete playlist

	if(!mongoose.Types.ObjectId.isValid(playlistId)){
		throw new ApiError(400, "Invalid playlist id")
	}
	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}
	await playlist.deleteOne()
	return res.status(200).json(
		new ApiResponse(200, null,"Playlist deleted successfully")
	)

})


//✅
const updatePlaylist = asyncHandler(async (req, res) => {
	//TODO: update playlist
	const { playlistId } = req.params
	const { name, description } = req.body
	if(!mongoose.Types.ObjectId.isValid(playlistId)){
		throw new ApiError(400, "Invalid playlist id")
	}
	const playlist = await Playlist.findById(playlistId)
	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}
	if (name) {
		playlist.name = name
	}
	if (description) {
		playlist.description = description
	}
	await playlist.save()
	return res.status(200).json(
		new ApiResponse(200, playlist,"Playlist updated successfully")
	)

})

export {
	createPlaylist,
	getUserPlaylists,
	getPlaylistById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	deletePlaylist,
	updatePlaylist
}