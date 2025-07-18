import { Router } from "express";
import {  loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";

const router =Router()
router.route("/register").post(

    upload.fields([{
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
           maxCount:1
    }
    ]),
    
    registerUser)


    router.route("/login").post(loginUser)

    //secure router
    router.route("/logout").post(verifyJWT,logoutUser)





export default router