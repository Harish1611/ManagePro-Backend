import express from "express";

import {

    createTask,

    getTasks,

    getTaskById,

    updateTask,

    deleteTask,

    uploadTaskAttachment,

    deleteTaskAttachment,

} from "../controllers/taskController.js";

import protect from "../middlewares/authMiddleware.js";

import validateRequest from "../middlewares/validateRequest.js";

import {

    taskAttachmentUpload,

} from "../middlewares/uploadMiddleware.js";

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

router.use(

    protect

);


/*
|--------------------------------------------------------------------------
| GET
| /api/tasks
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    validateRequest(

        taskQuerySchema,

        "query"

    ),

    getTasks

);


/*
|--------------------------------------------------------------------------
| POST
| /api/tasks
|--------------------------------------------------------------------------
*/

router.post(

    "/",

    validateRequest(

        createTaskSchema

    ),

    createTask

);


/*
|--------------------------------------------------------------------------
| POST
| /api/tasks/:taskId/attachments
|--------------------------------------------------------------------------
*/

router.post(

    "/:taskId/attachments",

    taskAttachmentUpload.single(

        "attachment"

    ),

    uploadTaskAttachment

);


/*
|--------------------------------------------------------------------------
| DELETE
| /api/tasks/:taskId/attachments/:attachmentId
|--------------------------------------------------------------------------
*/

router.delete(

    "/:taskId/attachments/:attachmentId",

    deleteTaskAttachment

);


/*
|--------------------------------------------------------------------------
| GET
| /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.get(

    "/:id",

    getTaskById

);


/*
|--------------------------------------------------------------------------
| PUT
| /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.put(

    "/:id",

    validateRequest(

        updateTaskSchema

    ),

    updateTask

);


/*
|--------------------------------------------------------------------------
| DELETE
| /api/tasks/:id
|--------------------------------------------------------------------------
*/

router.delete(

    "/:id",

    deleteTask

);


export default router;