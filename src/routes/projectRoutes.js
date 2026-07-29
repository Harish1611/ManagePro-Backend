import { Router } from "express";

import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectMembers,
} from "../controllers/projectController.js";

import protect from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";

import {
    createProjectSchema,
    updateProjectSchema,
    projectQuerySchema,
} from "../validators/projectValidation.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Project Routes
|--------------------------------------------------------------------------
*/

// Get All Projects
// Create Project
router
    .route("/")
    .get(
        protect,
        validateRequest(projectQuerySchema),
        getProjects
    )
    .post(
        protect,
        validateRequest(createProjectSchema),
        createProject
    );

// Get Single Project
// Update Project
// Delete Project
router
    .route("/:id")
    .get(
        protect,
        getProjectById
    )
    .put(
        protect,
        validateRequest(updateProjectSchema),
        updateProject
    )
    .delete(
        protect,
        deleteProject
    );



    router.get(
    "/:id/members",
    protect,
    getProjectMembers
);

export default router;