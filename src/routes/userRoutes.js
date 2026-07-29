import { Router } from "express";

import protect from "../middlewares/authMiddleware.js";

import {
    getUsers,
    getUser,
} from "../controllers/userController.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    protect,
    getUsers
);

router.get(
    "/:id",
    protect,
    getUser
);

export default router;