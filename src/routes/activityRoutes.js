import {

    Router,

} from "express";

import {

    getActivities,

} from "../controllers/activityController.js";

import protect from "../middlewares/authMiddleware.js";


const router = Router();


router.use(

    protect

);


router.get(

    "/",

    getActivities

);


export default router;