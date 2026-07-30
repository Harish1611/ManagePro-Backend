import Project from "../models/Project.js";
import User from "../models/User.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import logActivity from "../utils/logActivity.js";

import {

    ACTIVITY_ACTIONS,

    ACTIVITY_ENTITY_TYPES,

} from "../constants/activityConstants.js";


/*
|--------------------------------------------------------------------------
| POST
| /api/projects
|--------------------------------------------------------------------------
*/

export const createProject = asyncHandler(async (

    req,

    res

) => {

    const project = await Project.create({

        ...req.body,

        owner: req.user._id,

        members: [

            req.user._id,

        ],

    });


    /*
    |--------------------------------------------------------------------------
    | Activity Log
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.PROJECT_CREATED,

        entityType:

            ACTIVITY_ENTITY_TYPES.PROJECT,

        entityId:

            project._id,

        project:

            project._id,

        message:

            `${req.user.name || "A user"} created project ${project.name}`,

        metadata: {

            projectName:

                project.name,

            status:

                project.status,

        },

    });


    return res.status(201).json(

        new ApiResponse(

            201,

            "Project created successfully",

            project

        )

    );

});


/*
|--------------------------------------------------------------------------
| GET
| /api/projects
|--------------------------------------------------------------------------
*/

const escapeRegex = (

    value = ""

) => {

    return value.replace(

        /[.*+?^${}()|[\]\\]/g,

        "\\$&"

    );

};


export const getProjects = asyncHandler(async (

    req,

    res

) => {

    const {

        page = 1,

        limit = 10,

        search = "",

        status,

        sort = "-createdAt",

    } = req.query;


    const query = {

        owner:

            req.user._id,

        isDeleted:

            false,

    };


    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const normalizedSearch =

        search.trim();


    if (normalizedSearch) {

        const safeSearch =

            escapeRegex(

                normalizedSearch

            );


        query.$or = [

            {

                name: {

                    $regex:

                        safeSearch,

                    $options:

                        "i",

                },

            },

            {

                description: {

                    $regex:

                        safeSearch,

                    $options:

                        "i",

                },

            },

        ];

    }


    /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

    if (status) {

        query.status =

            status;

    }


    const currentPage =

        Math.max(

            Number(page) || 1,

            1

        );


    const perPage =

        Math.max(

            Number(limit) || 10,

            1

        );


    const [

        total,

        projects,

    ] = await Promise.all([

        Project.countDocuments(

            query

        ),

        Project.find(query)

            .populate(

                "owner",

                "name email avatar"

            )

            .populate(

                "members",

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

            ),

    ]);


    return res.json(

        new ApiResponse(

            200,

            "Projects fetched successfully",

            {

                projects,

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
| /api/projects/:id
|--------------------------------------------------------------------------
*/

export const getProjectById = asyncHandler(async (

    req,

    res

) => {

    const project = await Project.findOne({

        _id:

            req.params.id,

        owner:

            req.user._id,

        isDeleted:

            false,

    })

        .populate(

            "owner",

            "name email avatar"

        )

        .populate(

            "members",

            "name email avatar"

        );


    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }


    return res.json(

        new ApiResponse(

            200,

            "Project fetched successfully",

            project

        )

    );

});


/*
|--------------------------------------------------------------------------
| GET
| /api/projects/:id/members
|--------------------------------------------------------------------------
*/

export const getProjectMembers = asyncHandler(async (

    req,

    res

) => {

    const project = await Project.findOne({

        _id:

            req.params.id,

        isDeleted:

            false,

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

    })

        .populate(

            "owner",

            "name email avatar"

        )

        .populate(

            "members",

            "name email avatar"

        );


    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Remove duplicate owner if present in members
    |--------------------------------------------------------------------------
    */

    const members = [

        project.owner,

        ...project.members.filter(

            (member) =>

                member._id.toString() !==

                project.owner._id.toString()

        ),

    ];


    return res.json(

        new ApiResponse(

            200,

            "Project members fetched successfully",

            members

        )

    );

});


/*
|--------------------------------------------------------------------------
| PUT
| /api/projects/:id
|--------------------------------------------------------------------------
*/

export const updateProject = asyncHandler(async (

    req,

    res

) => {

    const project = await Project.findOne({

        _id:

            req.params.id,

        owner:

            req.user._id,

        isDeleted:

            false,

    });


    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Previous Project Data
    |--------------------------------------------------------------------------
    */

    const previousProject = {

        name:

            project.name,

        description:

            project.description,

        status:

            project.status,

    };


    Object.assign(

        project,

        req.body

    );


    await project.save();


    /*
    |--------------------------------------------------------------------------
    | Activity Log
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.PROJECT_UPDATED,

        entityType:

            ACTIVITY_ENTITY_TYPES.PROJECT,

        entityId:

            project._id,

        project:

            project._id,

        message:

            `${req.user.name || "A user"} updated project ${project.name}`,

        metadata: {

            projectName:

                project.name,

            previousName:

                previousProject.name,

            currentName:

                project.name,

            previousDescription:

                previousProject.description,

            currentDescription:

                project.description,

            previousStatus:

                previousProject.status,

            currentStatus:

                project.status,

        },

    });


    return res.json(

        new ApiResponse(

            200,

            "Project updated successfully",

            project

        )

    );

});


/*
|--------------------------------------------------------------------------
| DELETE
| /api/projects/:id
|--------------------------------------------------------------------------
*/

export const deleteProject = asyncHandler(async (

    req,

    res

) => {

    const project = await Project.findOne({

        _id:

            req.params.id,

        owner:

            req.user._id,

        isDeleted:

            false,

    });


    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }


    project.isDeleted =

        true;


    await project.save();


    /*
    |--------------------------------------------------------------------------
    | Activity Log
    |--------------------------------------------------------------------------
    */

    await logActivity({

        actor:

            req.user._id,

        action:

            ACTIVITY_ACTIONS.PROJECT_DELETED,

        entityType:

            ACTIVITY_ENTITY_TYPES.PROJECT,

        entityId:

            project._id,

        project:

            project._id,

        message:

            `${req.user.name || "A user"} deleted project ${project.name}`,

        metadata: {

            projectName:

                project.name,

            status:

                project.status,

        },

    });


    return res.json(

        new ApiResponse(

            200,

            "Project deleted successfully"

        )

    );

});


/*
|--------------------------------------------------------------------------
| POST
| /api/projects/:id/members
|--------------------------------------------------------------------------
*/

export const addProjectMembers = asyncHandler(async (

    req,

    res

) => {

    const {

        members = [],

    } = req.body;


    if (

        !Array.isArray(

            members

        ) ||

        members.length === 0

    ) {

        throw new ApiError(

            400,

            "Members array is required"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Owner Only
    |--------------------------------------------------------------------------
    */

    const project = await Project.findOne({

        _id:

            req.params.id,

        owner:

            req.user._id,

        isDeleted:

            false,

    });


    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Verify Users Exist
    |--------------------------------------------------------------------------
    */

    const users = await User.find({

        _id: {

            $in:

                members,

        },

        isActive:

            true,

    }).select(

        "_id name email"

    );


    if (

        users.length !==

        members.length

    ) {

        throw new ApiError(

            400,

            "One or more users do not exist"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Existing Member IDs
    |--------------------------------------------------------------------------
    */

    const previousMemberIds =

        new Set(

            project.members.map(

                (id) =>

                    id.toString()

            )

        );


    /*
    |--------------------------------------------------------------------------
    | Avoid Duplicates
    |--------------------------------------------------------------------------
    */

    const existingMembers =

        new Set(

            project.members.map(

                (id) =>

                    id.toString()

            )

        );


    members.forEach(

        (memberId) => {

            if (

                memberId.toString() !==

                project.owner.toString()

            ) {

                existingMembers.add(

                    memberId.toString()

                );

            }

        }

    );


    project.members = [

        ...existingMembers,

    ];


    await project.save();


    /*
    |--------------------------------------------------------------------------
    | Find Newly Added Members
    |--------------------------------------------------------------------------
    */

    const newlyAddedUsers =

        users.filter(

            (user) =>

                user._id.toString() !==

                    project.owner.toString() &&

                !previousMemberIds.has(

                    user._id.toString()

                )

        );


    /*
    |--------------------------------------------------------------------------
    | Activity Logs
    |--------------------------------------------------------------------------
    */

    await Promise.all(

        newlyAddedUsers.map(

            (addedUser) =>

                logActivity({

                    actor:

                        req.user._id,

                    action:

                        ACTIVITY_ACTIONS.PROJECT_MEMBER_ADDED,

                    entityType:

                        ACTIVITY_ENTITY_TYPES.PROJECT,

                    entityId:

                        project._id,

                    project:

                        project._id,

                    targetUser:

                        addedUser._id,

                    message:

                        `${req.user.name || "A user"} added ${addedUser.name} to ${project.name}`,

                    metadata: {

                        projectName:

                            project.name,

                        memberName:

                            addedUser.name,

                        memberEmail:

                            addedUser.email,

                    },

                })

        )

    );


    await project.populate(

        "members",

        "name email avatar role"

    );


    return res.json(

        new ApiResponse(

            200,

            "Members added successfully",

            project.members

        )

    );

});


/*
|--------------------------------------------------------------------------
| DELETE
| /api/projects/:id/members/:userId
|--------------------------------------------------------------------------
*/

export const removeProjectMember = asyncHandler(async (

    req,

    res

) => {

    const project = await Project.findOne({

        _id:

            req.params.id,

        owner:

            req.user._id,

        isDeleted:

            false,

    });


    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Cannot Remove Owner
    |--------------------------------------------------------------------------
    */

    if (

        req.params.userId ===

        project.owner.toString()

    ) {

        throw new ApiError(

            400,

            "Project owner cannot be removed"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Find Removed Member
    |--------------------------------------------------------------------------
    */

    const removedUser =

        await User.findById(

            req.params.userId

        ).select(

            "_id name email"

        );


    const wasProjectMember =

        project.members.some(

            (member) =>

                member.toString() ===

                req.params.userId

        );


    /*
    |--------------------------------------------------------------------------
    | Remove Member
    |--------------------------------------------------------------------------
    */

    project.members =

        project.members.filter(

            (member) =>

                member.toString() !==

                req.params.userId

        );


    await project.save();


    /*
    |--------------------------------------------------------------------------
    | Activity Log
    |--------------------------------------------------------------------------
    */

    if (wasProjectMember) {

        await logActivity({

            actor:

                req.user._id,

            action:

                ACTIVITY_ACTIONS.PROJECT_MEMBER_REMOVED,

            entityType:

                ACTIVITY_ENTITY_TYPES.PROJECT,

            entityId:

                project._id,

            project:

                project._id,

            targetUser:

                removedUser?._id || null,

            message:

                `${req.user.name || "A user"} removed ${removedUser?.name || "a member"} from ${project.name}`,

            metadata: {

                projectName:

                    project.name,

                memberName:

                    removedUser?.name || null,

                memberEmail:

                    removedUser?.email || null,

            },

        });

    }


    await project.populate(

        "members",

        "name email avatar role"

    );


    return res.json(

        new ApiResponse(

            200,

            "Member removed successfully",

            project.members

        )

    );

});