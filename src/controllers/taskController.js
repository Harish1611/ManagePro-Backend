import Task from "../models/Task.js";
import Project from "../models/Project.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import logActivity from "../utils/logActivity.js";

import {

    ACTIVITY_ACTIONS,

    ACTIVITY_ENTITY_TYPES,

} from "../constants/activityConstants.js";

import fs from "fs/promises";

import path from "path";


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

            {

                owner: userId,

            },

            {

                members: userId,

            },

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

    if (!assignedTo) {

        return;

    }


    const isOwner =

        project.owner.equals(

            assignedTo

        );


    const isMember =

        project.members.some(

            (member) =>

                member.equals(

                    assignedTo

                )

        );


    if (

        !isOwner &&

        !isMember

    ) {

        throw new ApiError(

            400,

            "Assigned user is not a member of this project"

        );

    }

};


/*
|--------------------------------------------------------------------------
| Helper - Convert ID To String
|--------------------------------------------------------------------------
*/

const getIdString = (

    value

) => {

    if (!value) {

        return null;

    }


    return (

        value._id ||

        value

    ).toString();

};


/*
|--------------------------------------------------------------------------
| POST
| /api/tasks
|--------------------------------------------------------------------------
*/

export const createTask = asyncHandler(async (

    req,

    res

) => {

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

        createdBy:

            req.user._id,

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

        await Task.findById(

            task._id

        )

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


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Task Created
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.TASK_CREATED,

        entityType:

            ACTIVITY_ENTITY_TYPES.TASK,

        entityId:

            task._id,

        project:

            existingProject._id,

        task:

            task._id,

        targetUser:

            assignedTo || null,

        message:

            `${req.user.name || "A user"} created task ${task.title}`,

        metadata: {

            taskTitle:

                task.title,

            projectName:

                existingProject.name,

            status:

                task.status,

            priority:

                task.priority,

            assignedTo:

                assignedTo || null,

            dueDate:

                task.dueDate || null,

        },

    });


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Task Assigned
    |--------------------------------------------------------------------------
    */

    if (assignedTo) {

        await logActivity({

            actor:

                req.user._id,

            action:

                ACTIVITY_ACTIONS.TASK_ASSIGNED,

            entityType:

                ACTIVITY_ENTITY_TYPES.TASK,

            entityId:

                task._id,

            project:

                existingProject._id,

            task:

                task._id,

            targetUser:

                assignedTo,

            message:

                `${req.user.name || "A user"} assigned ${task.title} to ${populatedTask?.assignedTo?.name || "a member"}`,

            metadata: {

                taskTitle:

                    task.title,

                projectName:

                    existingProject.name,

                previousAssignee:

                    null,

                currentAssignee:

                    assignedTo,

                currentAssigneeName:

                    populatedTask?.assignedTo?.name || null,

            },

        });

    }


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

export const getTasks = asyncHandler(async (

    req,

    res

) => {

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

                {

                    owner:

                        req.user._id,

                },

                {

                    members:

                        req.user._id,

                },

            ],

        }).select(

            "_id"

        );


    const projectIds =

        accessibleProjects.map(

            (projectItem) =>

                projectItem._id

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

        query.project =

            project;

    }


    if (assignedTo) {

        query.assignedTo =

            assignedTo;

    }


    if (priority) {

        query.priority =

            priority;

    }


    if (status) {

        query.status =

            status;

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

        await Task.countDocuments(

            query

        );


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

                (

                    currentPage -

                    1

                ) *

                    perPage

            )

            .limit(

                perPage

            )

            .lean();


    return res.json(

        new ApiResponse(

            200,

            "Tasks fetched successfully",

            {

                tasks,

                pagination: {

                    page:

                        currentPage,

                    limit:

                        perPage,

                    total,

                    totalPages:

                        Math.ceil(

                            total /

                                perPage

                        ),

                },

            }

        )

    );

});


/*
|--------------------------------------------------------------------------
| GET
| /api/tasks/:id
|--------------------------------------------------------------------------
*/

export const getTaskById = asyncHandler(async (

    req,

    res

) => {

    const task =

        await Task.findOne({

            _id:

                req.params.id,

            isDeleted:

                false,

        })

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
| PUT
| /api/tasks/:id
|--------------------------------------------------------------------------
*/

export const updateTask = asyncHandler(async (

    req,

    res

) => {

    const task =

        await Task.findOne({

            _id:

                req.params.id,

            isDeleted:

                false,

        });


    if (!task) {

        throw new ApiError(

            404,

            "Task not found"

        );

    }


    const accessibleProject =

        await getAccessibleProject(

            task.project,

            req.user._id

        );


    /*
    |--------------------------------------------------------------------------
    | Previous Task Values
    |--------------------------------------------------------------------------
    */

    const previousTask = {

        title:

            task.title,

        description:

            task.description,

        project:

            getIdString(

                task.project

            ),

        assignedTo:

            getIdString(

                task.assignedTo

            ),

        priority:

            task.priority,

        status:

            task.status,

        dueDate:

            task.dueDate,

    };


    /*
    |--------------------------------------------------------------------------
    | Validate Project Change
    |--------------------------------------------------------------------------
    */

    let updatedProject =

        accessibleProject;


    if (

        req.body.project &&

        req.body.project.toString() !==

            task.project.toString()

    ) {

        updatedProject =

            await getAccessibleProject(

                req.body.project,

                req.user._id

            );

    }


    Object.assign(

        task,

        req.body

    );


    await task.save();


    const updatedTask =

        await Task.findById(

            task._id

        )

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


    /*
    |--------------------------------------------------------------------------
    | Current Task Values
    |--------------------------------------------------------------------------
    */

    const currentTask = {

        title:

            task.title,

        description:

            task.description,

        project:

            getIdString(

                task.project

            ),

        assignedTo:

            getIdString(

                task.assignedTo

            ),

        priority:

            task.priority,

        status:

            task.status,

        dueDate:

            task.dueDate,

    };


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Task Updated
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.TASK_UPDATED,

        entityType:

            ACTIVITY_ENTITY_TYPES.TASK,

        entityId:

            task._id,

        project:

            task.project,

        task:

            task._id,

        targetUser:

            task.assignedTo || null,

        message:

            `${req.user.name || "A user"} updated task ${task.title}`,

        metadata: {

            taskTitle:

                task.title,

            projectName:

                updatedProject?.name ||

                updatedTask?.project?.name ||

                null,

            previousValues:

                previousTask,

            currentValues:

                currentTask,

        },

    });


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Status Changed
    |--------------------------------------------------------------------------
    */

    if (

        previousTask.status !==

        currentTask.status

    ) {

        await logActivity({

            actor:

                req.user._id,

            action:

                ACTIVITY_ACTIONS.TASK_STATUS_CHANGED,

            entityType:

                ACTIVITY_ENTITY_TYPES.TASK,

            entityId:

                task._id,

            project:

                task.project,

            task:

                task._id,

            targetUser:

                task.assignedTo || null,

            message:

                `${req.user.name || "A user"} moved ${task.title} from ${previousTask.status} to ${currentTask.status}`,

            metadata: {

                taskTitle:

                    task.title,

                previousStatus:

                    previousTask.status,

                currentStatus:

                    currentTask.status,

            },

        });

    }


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Assignment Changed
    |--------------------------------------------------------------------------
    */

    if (

        previousTask.assignedTo !==

        currentTask.assignedTo

    ) {

        const assigneeName =

            updatedTask?.assignedTo?.name ||

            null;


        await logActivity({

            actor:

                req.user._id,

            action:

                ACTIVITY_ACTIONS.TASK_ASSIGNED,

            entityType:

                ACTIVITY_ENTITY_TYPES.TASK,

            entityId:

                task._id,

            project:

                task.project,

            task:

                task._id,

            targetUser:

                task.assignedTo || null,

            message:

                task.assignedTo

                    ? `${req.user.name || "A user"} assigned ${task.title} to ${assigneeName || "a member"}`

                    : `${req.user.name || "A user"} unassigned ${task.title}`,

            metadata: {

                taskTitle:

                    task.title,

                previousAssignee:

                    previousTask.assignedTo,

                currentAssignee:

                    currentTask.assignedTo,

                currentAssigneeName:

                    assigneeName,

            },

        });

    }


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
| DELETE
| /api/tasks/:id
|--------------------------------------------------------------------------
*/

export const deleteTask = asyncHandler(async (

    req,

    res

) => {

    const task =

        await Task.findOne({

            _id:

                req.params.id,

            isDeleted:

                false,

        });


    if (!task) {

        throw new ApiError(

            404,

            "Task not found"

        );

    }


    const project =

        await getAccessibleProject(

            task.project,

            req.user._id

        );


    task.isDeleted =

        true;


    await task.save();


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Task Deleted
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.TASK_DELETED,

        entityType:

            ACTIVITY_ENTITY_TYPES.TASK,

        entityId:

            task._id,

        project:

            task.project,

        task:

            task._id,

        targetUser:

            task.assignedTo || null,

        message:

            `${req.user.name || "A user"} deleted task ${task.title}`,

        metadata: {

            taskTitle:

                task.title,

            projectName:

                project.name,

            status:

                task.status,

            priority:

                task.priority,

            assignedTo:

                task.assignedTo || null,

        },

    });


    return res.json(

        new ApiResponse(

            200,

            "Task deleted successfully"

        )

    );

});


/*
|--------------------------------------------------------------------------
| Delete Uploaded Local File
|--------------------------------------------------------------------------
*/

const deleteLocalAttachmentFile = async (

    filePath

) => {

    if (!filePath) {

        return;

    }


    try {

        await fs.unlink(

            filePath

        );

    }

    catch (error) {

        if (

            error.code !==

            "ENOENT"

        ) {

            console.error(

                "Failed to delete attachment file:",

                error

            );

        }

    }

};


/*
|--------------------------------------------------------------------------
| Validate Task Access
|--------------------------------------------------------------------------
*/

const validateTaskAttachmentAccess = async (

    task,

    userId

) => {

    const hasAccess =

        await Project.exists({

            _id:

                task.project,

            isDeleted:

                false,

            $or: [

                {

                    owner:

                        userId,

                },

                {

                    members:

                        userId,

                },

            ],

        });


    if (!hasAccess) {

        throw new ApiError(

            403,

            "You are not authorized to manage attachments for this task."

        );

    }

};


/*
|--------------------------------------------------------------------------
| POST
| /api/tasks/:taskId/attachments
|--------------------------------------------------------------------------
*/

export const uploadTaskAttachment = asyncHandler(async (

    req,

    res

) => {

    /*
    |--------------------------------------------------------------------------
    | Validate Uploaded File
    |--------------------------------------------------------------------------
    */

    if (!req.file) {

        throw new ApiError(

            400,

            "Please select a file to upload."

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Find Task
    |--------------------------------------------------------------------------
    */

    const task =

        await Task.findOne({

            _id:

                req.params.taskId,

            isDeleted:

                false,

        });


    if (!task) {

        await deleteLocalAttachmentFile(

            req.file.path

        );


        throw new ApiError(

            404,

            "Task not found."

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Validate Access
    |--------------------------------------------------------------------------
    */

    try {

        await validateTaskAttachmentAccess(

            task,

            req.user._id

        );

    }

    catch (error) {

        await deleteLocalAttachmentFile(

            req.file.path

        );


        throw error;

    }


    /*
    |--------------------------------------------------------------------------
    | Save Attachment Metadata
    |--------------------------------------------------------------------------
    */

    const attachment = {

        fileName:

            req.file.originalname,

        fileUrl:

            `/uploads/attachments/${req.file.filename}`,

        fileSize:

            req.file.size,

        mimeType:

            req.file.mimetype,

        uploadedAt:

            new Date(),

    };


    task.attachments.push(

        attachment

    );


    try {

        await task.save();

    }

    catch (error) {

        await deleteLocalAttachmentFile(

            req.file.path

        );


        throw error;

    }


    /*
    |--------------------------------------------------------------------------
    | Get Saved Attachment
    |--------------------------------------------------------------------------
    */

    const savedAttachment =

        task.attachments[

            task.attachments.length -

            1

        ];


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Attachment Uploaded
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.ATTACHMENT_UPLOADED,

        entityType:

            ACTIVITY_ENTITY_TYPES.ATTACHMENT,

        entityId:

            savedAttachment?._id ||

            task._id,

        project:

            task.project,

        task:

            task._id,

        targetUser:

            task.assignedTo || null,

        message:

            `${req.user.name || "A user"} uploaded ${req.file.originalname} to ${task.title}`,

        metadata: {

            taskTitle:

                task.title,

            attachmentId:

                savedAttachment?._id || null,

            fileName:

                req.file.originalname,

            storedFileName:

                req.file.filename,

            fileUrl:

                savedAttachment?.fileUrl ||

                attachment.fileUrl,

            fileSize:

                req.file.size,

            mimeType:

                req.file.mimetype,

        },

    });


    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json(

        new ApiResponse(

            201,

            "Attachment uploaded successfully",

            {

                attachments:

                    task.attachments,

            }

        )

    );

});


/*
|--------------------------------------------------------------------------
| DELETE
| /api/tasks/:taskId/attachments/:attachmentId
|--------------------------------------------------------------------------
*/

export const deleteTaskAttachment = asyncHandler(async (

    req,

    res

) => {

    /*
    |--------------------------------------------------------------------------
    | Find Task
    |--------------------------------------------------------------------------
    */

    const task =

        await Task.findOne({

            _id:

                req.params.taskId,

            isDeleted:

                false,

        });


    if (!task) {

        throw new ApiError(

            404,

            "Task not found."

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Validate Access
    |--------------------------------------------------------------------------
    */

    await validateTaskAttachmentAccess(

        task,

        req.user._id

    );


    /*
    |--------------------------------------------------------------------------
    | Find Attachment
    |--------------------------------------------------------------------------
    */

    const attachment =

        task.attachments.id(

            req.params.attachmentId

        );


    if (!attachment) {

        throw new ApiError(

            404,

            "Attachment not found."

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Store Attachment Data Before Removal
    |--------------------------------------------------------------------------
    */

    const deletedAttachment = {

        _id:

            attachment._id,

        fileName:

            attachment.fileName,

        fileUrl:

            attachment.fileUrl,

        fileSize:

            attachment.fileSize,

        mimeType:

            attachment.mimeType,

        uploadedAt:

            attachment.uploadedAt,

    };


    /*
    |--------------------------------------------------------------------------
    | Build Local File Path
    |--------------------------------------------------------------------------
    */

    const relativeFilePath =

        attachment.fileUrl.replace(

            /^\/+/,

            ""

        );


    const localFilePath =

        path.join(

            process.cwd(),

            relativeFilePath

        );


    /*
    |--------------------------------------------------------------------------
    | Remove Attachment From Task
    |--------------------------------------------------------------------------
    */

    task.attachments.pull(

        attachment._id

    );


    await task.save();


    /*
    |--------------------------------------------------------------------------
    | Delete Local File
    |--------------------------------------------------------------------------
    */

    await deleteLocalAttachmentFile(

        localFilePath

    );


    /*
    |--------------------------------------------------------------------------
    | Activity Log - Attachment Deleted
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.ATTACHMENT_DELETED,

        entityType:

            ACTIVITY_ENTITY_TYPES.ATTACHMENT,

        entityId:

            deletedAttachment._id,

        project:

            task.project,

        task:

            task._id,

        targetUser:

            task.assignedTo || null,

        message:

            `${req.user.name || "A user"} deleted ${deletedAttachment.fileName} from ${task.title}`,

        metadata: {

            taskTitle:

                task.title,

            attachmentId:

                deletedAttachment._id,

            fileName:

                deletedAttachment.fileName,

            fileUrl:

                deletedAttachment.fileUrl,

            fileSize:

                deletedAttachment.fileSize,

            mimeType:

                deletedAttachment.mimeType,

        },

    });


    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json(

        new ApiResponse(

            200,

            "Attachment deleted successfully",

            {

                attachments:

                    task.attachments,

            }

        )

    );

});