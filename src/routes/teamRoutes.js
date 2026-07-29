import { Router } from "express";

import protect from "../middlewares/authMiddleware.js";

import {
    getTeamMembers,
    getMemberProfile,
    getMemberProjects,
    getMemberTasks,
    getMemberWorkload,
} from "../controllers/teamController.js";


const router = Router();


/*
|--------------------------------------------------------------------------
| Team Routes
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET
| /api/team
|
| Get all team members
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    protect,

    getTeamMembers

);


/*
|--------------------------------------------------------------------------
| GET
| /api/team/:id
|
| Get member profile
|--------------------------------------------------------------------------
*/

router.get(

    "/:id",

    protect,

    getMemberProfile

);


/*
|--------------------------------------------------------------------------
| GET
| /api/team/:id/projects
|
| Get member assigned projects
|--------------------------------------------------------------------------
*/

router.get(

    "/:id/projects",

    protect,

    getMemberProjects

);


/*
|--------------------------------------------------------------------------
| GET
| /api/team/:id/tasks
|
| Get member assigned tasks
|--------------------------------------------------------------------------
*/

router.get(

    "/:id/tasks",

    protect,

    getMemberTasks

);


/*
|--------------------------------------------------------------------------
| GET
| /api/team/:id/workload
|
| Get member workload overview
|--------------------------------------------------------------------------
*/

router.get(

    "/:id/workload",

    protect,

    getMemberWorkload

);



export default router;