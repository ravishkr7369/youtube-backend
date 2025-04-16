import { userRegister, userLogin, userLogout, refreshAccessToken } from "../controllers/user.controller.js";
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
router.post("/refresh-token", refreshAccessToken);




export default router;