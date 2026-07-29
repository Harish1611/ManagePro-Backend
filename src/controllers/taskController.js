import Task from "../models/Task.js";
import Project from "../models/Project.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

/*
|--------------------------------------------------------------------------
| Helper - Get Accessible Project
|--------------------------------------------------------------------------
*/

const getAccessibleProject = async (
    projectId,
    userId
) => {

    const project = await Project.findOne({
        _id: projectId,
        isDeleted: false,
        $or: [
            { owner: userId },
            { members: userId },
        ],
    });

    if (!project) {
        throw new ApiError(
            404,
            "Project not found or access denied"
        );
    }

    return project;

};

/*
|--------------------------------------------------------------------------
| Helper - Validate Assigned User
|--------------------------------------------------------------------------
*/

const validateAssignedUser = (
    project,
    assignedTo
) => {

    if (!assignedTo) return;

    const isOwner =
        project.owner.equals(assignedTo);

    const isMember =
        project.members.some(member =>
            member.equals(assignedTo)
        );

    if (!isOwner && !isMember) {
        throw new ApiError(
            400,
            "Assigned user is not a member of this project"
        );
    }

};

/*
|--------------------------------------------------------------------------
| POST
| /api/tasks
|--------------------------------------------------------------------------
*/

export const createTask = asyncHandler(async (req, res) => {

    const {
        title,
        description,
        project,
        assignedTo,
        priority,
        status,
        dueDate,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Verify Project
    |--------------------------------------------------------------------------
    */

    const existingProject =
        await getAccessibleProject(
            project,
            req.user._id
        );

    /*
    |--------------------------------------------------------------------------
    | Verify Assignee
    |--------------------------------------------------------------------------
    */

    validateAssignedUser(
        existingProject,
        assignedTo
    );

    /*
    |--------------------------------------------------------------------------
    | Create Task
    |--------------------------------------------------------------------------
    */

    const task = await Task.create({

        title,

        description,

        project,

        assignedTo,

        createdBy: req.user._id,

        priority,

        status,

        dueDate,

    });

    /*
    |--------------------------------------------------------------------------
    | Populate Relations
    |--------------------------------------------------------------------------
    */

    const populatedTask =
        await Task.findById(task._id)
            .populate(
                "project",
                "name color"
            )
            .populate(
                "assignedTo",
                "name email avatar"
            )
            .populate(
                "createdBy",
                "name email avatar"
            );

    return res.status(201).json(

        new ApiResponse(

            201,

            "Task created successfully",

            populatedTask

        )

    );

});

/*
|--------------------------------------------------------------------------
| GET
| /api/tasks
|--------------------------------------------------------------------------
*/

export const getTasks = asyncHandler(async (req, res) => {

    const {

        page = 1,

        limit = 10,

        search = "",

        project,

        assignedTo,

        priority,

        status,

        sort = "-createdAt",

    } = req.query;

    /*
    |--------------------------------------------------------------------------
    | Accessible Projects
    |--------------------------------------------------------------------------
    */

    const accessibleProjects =
        await Project.find({

            isDeleted: false,

            $or: [

                { owner: req.user._id },

                { members: req.user._id },

            ],

        }).select("_id");

    const projectIds =
        accessibleProjects.map(
            project => project._id
        );

    /*
    |--------------------------------------------------------------------------
    | Query
    |--------------------------------------------------------------------------
    */

    const query = {

        isDeleted: false,

        project: {
            $in: projectIds,
        },

    };

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search) {

        query.$or = [

            {

                title: {

                    $regex: search,

                    $options: "i",

                },

            },

            {

                description: {

                    $regex: search,

                    $options: "i",

                },

            },

        ];

    }

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    if (project) {
        query.project = project;
    }

    if (assignedTo) {
        query.assignedTo = assignedTo;
    }

    if (priority) {
        query.priority = priority;
    }

    if (status) {
        query.status = status;
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const currentPage =
        Number(page);

    const perPage =
        Number(limit);

    const total =
        await Task.countDocuments(query);

    const tasks =
        await Task.find(query)

            .populate(
                "project",
                "name color"
            )

            .populate(
                "assignedTo",
                "name email avatar"
            )

            .populate(
                "createdBy",
                "name email avatar"
            )

            .sort(sort)

            .skip(
                (currentPage - 1) * perPage
            )

            .limit(perPage)

            .lean();

    return res.json(

        new ApiResponse(

            200,

            "Tasks fetched successfully",

            {

                tasks,

                pagination: {

                    page: currentPage,

                    limit: perPage,

                    total,

                    totalPages: Math.ceil(
                        total / perPage
                    ),

                },

            }

        )

    );

});

/*
|--------------------------------------------------------------------------
| GET /api/tasks/:id
|--------------------------------------------------------------------------
*/

export const getTaskById = asyncHandler(async (req, res) => {

    const task = await Task.findOne({
        _id: req.params.id,
        isDeleted: false,
    })
        .populate("project", "name color")
        .populate("assignedTo", "name email avatar")
        .populate("createdBy", "name email avatar");

    if (!task) {
        throw new ApiError(
            404,
            "Task not found"
        );
    }

    await getAccessibleProject(
        task.project._id,
        req.user._id
    );

    return res.json(
        new ApiResponse(
            200,
            "Task fetched successfully",
            task
        )
    );

});


/*
|--------------------------------------------------------------------------
| PUT /api/tasks/:id
|--------------------------------------------------------------------------
*/

export const updateTask = asyncHandler(async (req, res) => {

    const task = await Task.findOne({
        _id: req.params.id,
        isDeleted: false,
    });

    if (!task) {
        throw new ApiError(
            404,
            "Task not found"
        );
    }

    await getAccessibleProject(
        task.project,
        req.user._id
    );

    /*
    |--------------------------------------------------------------------------
    | Validate Project Change
    |--------------------------------------------------------------------------
    */

    if (
        req.body.project &&
        req.body.project.toString() !== task.project.toString()
    ) {

        await getAccessibleProject(
            req.body.project,
            req.user._id
        );

    }

    Object.assign(task, req.body);

    await task.save();

    const updatedTask = await Task.findById(task._id)
        .populate("project", "name color")
        .populate("assignedTo", "name email avatar")
        .populate("createdBy", "name email avatar");

    return res.json(
        new ApiResponse(
            200,
            "Task updated successfully",
            updatedTask
        )
    );

});


/*
|--------------------------------------------------------------------------
| DELETE /api/tasks/:id
|--------------------------------------------------------------------------
*/

export const deleteTask = asyncHandler(async (req, res) => {

    const task = await Task.findOne({
        _id: req.params.id,
        isDeleted: false,
    });

    if (!task) {
        throw new ApiError(
            404,
            "Task not found"
        );
    }

    await getAccessibleProject(
        task.project,
        req.user._id
    );

    task.isDeleted = true;

    await task.save();

    return res.json(
        new ApiResponse(
            200,
            "Task deleted successfully"
        )
    );

});