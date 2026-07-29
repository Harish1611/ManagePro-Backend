import express from "express";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from "../controllers/taskController.js";

import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
    createTaskSchema,
    updateTaskSchema,
    taskQuerySchema,
} from "../validators/taskValidation.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| All Task Routes Require Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| GET /api/tasks
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    validateRequest(taskQuerySchema, "query"),
    getTasks
);

/*
|--------------------------------------------------------------------------
| POST /api/tasks
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    validateRequest(createTaskSchema),
    createTask
);

/*
|--------------------------------------------------------------------------
| GET /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    getTaskById
);

/*
|--------------------------------------------------------------------------
| PUT /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    validateRequest(updateTaskSchema),
    updateTask
);

/*
|--------------------------------------------------------------------------
| DELETE /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    deleteTask
);

export default router;