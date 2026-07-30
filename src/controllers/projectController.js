import Project from "../models/Project.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.js";


/*
|--------------------------------------------------------------------------
| POST
| /api/projects
|--------------------------------------------------------------------------
*/

export const createProject = asyncHandler(async (req, res) => {

    const project = await Project.create({

        ...req.body,

        owner: req.user._id,

        members: [req.user._id],

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

const escapeRegex = (value = "") => {

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

        owner: req.user._id,

        isDeleted: false,

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

            escapeRegex(normalizedSearch);


        query.$or = [

            {

                name: {

                    $regex: safeSearch,

                    $options: "i",

                },

            },

            {

                description: {

                    $regex: safeSearch,

                    $options: "i",

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

        query.status = status;

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

        Project.countDocuments(query),

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

                (currentPage - 1) *

                perPage

            )

            .limit(perPage),

    ]);


    return res.json(

        new ApiResponse(

            200,

            "Projects fetched successfully",

            {

                projects,

                pagination: {

                    page: currentPage,

                    limit: perPage,

                    total,

                    totalPages:

                        Math.ceil(

                            total / perPage

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

export const getProjectById = asyncHandler(async (req, res) => {

    const project = await Project.findOne({

        _id: req.params.id,

        owner: req.user._id,

        isDeleted: false,

    })

        .populate("owner", "name email avatar")

        .populate("members", "name email avatar");

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

export const getProjectMembers = asyncHandler(async (req, res) => {

    const project = await Project.findOne({

        _id: req.params.id,

        isDeleted: false,

        $or: [

            {

                owner: req.user._id,

            },

            {

                members: req.user._id,

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

export const updateProject = asyncHandler(async (req, res) => {

    const project = await Project.findOne({

        _id: req.params.id,

        owner: req.user._id,

        isDeleted: false,

    });

    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }

    Object.assign(

        project,

        req.body

    );

    await project.save();

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

export const deleteProject = asyncHandler(async (req, res) => {

    const project = await Project.findOne({

        _id: req.params.id,

        owner: req.user._id,

        isDeleted: false,

    });

    if (!project) {

        throw new ApiError(

            404,

            "Project not found"

        );

    }

    project.isDeleted = true;

    await project.save();

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

export const addProjectMembers = asyncHandler(async (req, res) => {

    const { members = [] } = req.body;

    if (!Array.isArray(members) || members.length === 0) {

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

        _id: req.params.id,

        owner: req.user._id,

        isDeleted: false,

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
            $in: members,
        },

        isActive: true,

    }).select("_id");

    if (users.length !== members.length) {

        throw new ApiError(
            400,
            "One or more users do not exist"
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Avoid Duplicates
    |--------------------------------------------------------------------------
    */

    const existingMembers = new Set(

        project.members.map(id =>
            id.toString()
        )

    );

    members.forEach((memberId) => {

        if (
            memberId.toString() !==
            project.owner.toString()
        ) {

            existingMembers.add(
                memberId.toString()
            );

        }

    });

    project.members = [...existingMembers];

    await project.save();

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

export const removeProjectMember = asyncHandler(async (req, res) => {

    const project = await Project.findOne({

        _id: req.params.id,

        owner: req.user._id,

        isDeleted: false,

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
    | Remove Member
    |--------------------------------------------------------------------------
    */

    project.members = project.members.filter(

        (member) =>

            member.toString() !==
            req.params.userId

    );

    await project.save();

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