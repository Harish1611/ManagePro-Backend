import {

    Router,

} from "express";


import protect from "../middlewares/authMiddleware.js";

import validateRequest from "../middlewares/validateRequest.js";


import {

    getProfile,

    updateProfile,

    changePassword,

    uploadProfileAvatar,

    removeProfileAvatar,

} from "../controllers/profileController.js";

import {

    avatarUpload,

} from "../middlewares/uploadMiddleware.js";


import {

    updateProfileSchema,

    changePasswordSchema,

} from "../validators/profileValidation.js";


const router = Router();


/*
|--------------------------------------------------------------------------
| GET
| /api/profile
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    protect,

    getProfile

);


/*
|--------------------------------------------------------------------------
| PUT
| /api/profile
|--------------------------------------------------------------------------
*/

router.put(

    "/",

    protect,

    validateRequest(

        updateProfileSchema

    ),

    updateProfile

);


/*
|--------------------------------------------------------------------------
| PUT
| /api/profile/password
|--------------------------------------------------------------------------
*/

router.put(

    "/password",

    protect,

    validateRequest(

        changePasswordSchema

    ),

    changePassword

);


router.post(

    "/avatar",
      protect,

    avatarUpload.single("avatar"),

    uploadProfileAvatar

);


router.delete(

    "/avatar",
      protect,

    removeProfileAvatar

);

export default router;