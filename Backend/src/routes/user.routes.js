import {
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
} from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from '../middlewares/multer.middleware.js'
import {jwtVerify} from "../middlewares/auth.middleware.js";


const router = Router();

router.post("/register", upload.fields([
	{
		name: "avatar",
		maxCount:1

	},
	{
		name: "coverImage",
		maxCount:1


	}
]), userRegister);


router.post("/login", userLogin);

// secure routes
router.post("/logout", jwtVerify, userLogout);
router.post("/refresh-token",jwtVerify, refreshAccessToken);
router.post("/forget-password", jwtVerify, changeOldPassword)
router.get("/current-user", jwtVerify, currentUser)
router.patch("/update-account", jwtVerify, updateUserDetails)

router.patch("/avatar", jwtVerify, upload.single("avatar"), updateUserAvatar)
router.patch("/cover-image", jwtVerify, upload.single("coverImage"), updateUserCoverImage)

router.get("/c/:username", jwtVerify, getUserChannelProfile)
router.get("/history", jwtVerify, getWatchHistory)




export default router;