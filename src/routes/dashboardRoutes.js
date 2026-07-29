import { Router } from "express";

import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import { getDashboard } from "../controllers/dashboardController.js";

import { dashboardSchema } from "../validators/dashboardValidation.js";

const router = Router();

router.get(

    "/",

    protect,

    validateRequest(dashboardSchema),

    getDashboard

);

export default router;