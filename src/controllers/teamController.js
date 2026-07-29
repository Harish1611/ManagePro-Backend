import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

/*
|--------------------------------------------------------------------------
| GET
| /api/team
|--------------------------------------------------------------------------
| Returns all unique members belonging to the logged-in user's workspace.
| Includes:
| - Project Owner
| - Project Members
| - Project Count
| - Task Count
| - Completed Tasks
| - Pending Tasks
|--------------------------------------------------------------------------
*/

export const getTeamMembers = asyncHandler(async (req, res) => {

    /*
    |--------------------------------------------------------------------------
    | Fetch all accessible projects
    |--------------------------------------------------------------------------
    */

    const projects = await Project.find({

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
            "name email avatar role isActive"
        )

        .populate(
            "members",
            "name email avatar role isActive"
        );

    /*
    |--------------------------------------------------------------------------
    | Collect Unique Members
    |--------------------------------------------------------------------------
    */

    const membersMap = new Map();

    projects.forEach((project) => {

        if (project.owner) {

            membersMap.set(
                project.owner._id.toString(),
                project.owner
            );

        }

        project.members.forEach((member) => {

            membersMap.set(
                member._id.toString(),
                member
            );

        });

    });

    const members = [];

    /*
    |--------------------------------------------------------------------------
    | Calculate statistics for each member
    |--------------------------------------------------------------------------
    */

    for (const member of membersMap.values()) {

        const memberId = member._id;

        const [

            projectsCount,

            tasksCount,

            completedTasks,

            pendingTasks,

        ] = await Promise.all([

            Project.countDocuments({

                isDeleted: false,

                $or: [

                    {
                        owner: memberId,
                    },

                    {
                        members: memberId,
                    },

                ],

            }),

            Task.countDocuments({

                assignedTo: memberId,

                isDeleted: false,

            }),

            Task.countDocuments({

                assignedTo: memberId,

                status: "Done",

                isDeleted: false,

            }),

            Task.countDocuments({

                assignedTo: memberId,

                status: {
                    $ne: "Done",
                },

                isDeleted: false,

            }),

        ]);

       members.push({

    _id: member._id,

    name: member.name,

    email: member.email,

    avatar: member.avatar,

    role: member.role,

    isActive: member.isActive,

    createdAt: member.createdAt,

    projectsCount,

    tasksCount,

    completedTasks,

    pendingTasks,

});

    }

   /*
|-------------------------------------------------------------------------- 
| Pagination
|-------------------------------------------------------------------------- 
*/

const {

    page = 1,

    limit = 10,

    search = "",

    role = "",

    status = "",

    sort = "name",

} = req.query;

const currentPage = Number(page);

const perPage = Number(limit);

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

let filteredMembers = [...members];

if (search) {

    const keyword = search.toLowerCase();

    filteredMembers = filteredMembers.filter(

        (member) =>

            member.name.toLowerCase().includes(keyword) ||

            member.email.toLowerCase().includes(keyword)

    );

}

/*
|--------------------------------------------------------------------------
| Role Filter
|--------------------------------------------------------------------------
*/

if (role) {

    filteredMembers = filteredMembers.filter(

        (member) => member.role === role

    );

}

/*
|--------------------------------------------------------------------------
| Status Filter
|--------------------------------------------------------------------------
*/

if (status) {

    const active = status === "active";

    filteredMembers = filteredMembers.filter(

        (member) => member.isActive === active

    );

}

/*
|--------------------------------------------------------------------------
| Sorting
|--------------------------------------------------------------------------
*/

switch (sort) {

    case "name":

        filteredMembers.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        break;

    case "-name":

        filteredMembers.sort((a, b) =>
            b.name.localeCompare(a.name)
        );

        break;

    case "createdAt":

        filteredMembers.sort(
            (a, b) =>
                new Date(a.createdAt) -
                new Date(b.createdAt)
        );

        break;

    case "-createdAt":

        filteredMembers.sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

        break;

    default:

        filteredMembers.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

const total = filteredMembers.length;

const paginatedMembers = filteredMembers.slice(

    (currentPage - 1) * perPage,

    currentPage * perPage

);



return res.json(

    new ApiResponse(

        200,

        "Team members fetched successfully",

        {

            users: paginatedMembers,

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
| GET
| /api/team/:id
|--------------------------------------------------------------------------
| Returns detailed profile of a team member
|--------------------------------------------------------------------------
*/

export const getMemberProfile = asyncHandler(async (req, res) => {

    const member = await User.findById(req.params.id)

        .select(

            "name email avatar role phone isActive createdAt"

        );

            console.log("PROFILE API");


    if (!member) {

        throw new ApiError(

            404,

            "Member not found"

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Ensure logged-in user has access to this member
    |--------------------------------------------------------------------------
    */

const hasAccess = await Project.exists({

    isDeleted: false,

    $and: [

        {
            $or: [
                { owner: req.user._id },
                { members: req.user._id },
            ],
        },

        {
            $or: [
                { owner: member._id },
                { members: member._id },
            ],
        },

    ],

});

    if (!hasAccess) {

        throw new ApiError(

            403,

            "You are not authorized to view this member."

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    const [

        projectsCount,

        tasksCount,

        completedTasks,

        pendingTasks,

        overdueTasks,

    ] = await Promise.all([

        Project.countDocuments({

            isDeleted: false,

            $or: [

                {
                    owner: member._id,
                },

                {
                    members: member._id,
                },

            ],

        }),

        Task.countDocuments({

            assignedTo: member._id,

            isDeleted: false,

        }),

        Task.countDocuments({

            assignedTo: member._id,

            status: "Done",

            isDeleted: false,

        }),

        Task.countDocuments({

            assignedTo: member._id,

            status: {
                $ne: "Done",
            },

            isDeleted: false,

        }),

        Task.countDocuments({

            assignedTo: member._id,

            status: {
                $ne: "Done",
            },

            dueDate: {

                $lt: new Date(),

            },

            isDeleted: false,

        }),

    ]);

    return res.json(

        new ApiResponse(

            200,

            "Member profile fetched successfully",

            {

                ...member.toObject(),

                projectsCount,

                tasksCount,

                completedTasks,

                pendingTasks,

                overdueTasks,

            }

        )

    );

});

/*
|--------------------------------------------------------------------------
| GET
| /api/team/:id/projects
|--------------------------------------------------------------------------
| Returns all projects assigned to a team member
|--------------------------------------------------------------------------
*/

export const getMemberProjects = asyncHandler(async (req, res) => {

    const member = await User.findById(req.params.id);

    if (!member) {

        throw new ApiError(
            404,
            "Member not found"
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Verify access
    |--------------------------------------------------------------------------
    */

    const hasAccess = await Project.exists({

        isDeleted: false,

        $and: [

            {
                $or: [

                    { owner: req.user._id },

                    { members: req.user._id },

                ],

            },

            {
                $or: [

                    { owner: member._id },

                    { members: member._id },

                ],

            },

        ],

    });

    if (!hasAccess) {

        throw new ApiError(
            403,
            "You are not authorized to view this member."
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Fetch Projects
    |--------------------------------------------------------------------------
    */

    const projects = await Project.find({

        isDeleted: false,

        $or: [

            { owner: member._id },

            { members: member._id },

        ],

    })

        .populate(
            "owner",
            "name email avatar"
        )

        .populate(
            "members",
            "name email avatar"
        )

        .sort({
            createdAt: -1,
        });

    /*
    |--------------------------------------------------------------------------
    | Attach Progress
    |--------------------------------------------------------------------------
    */

    const data = await Promise.all(

        projects.map(async (project) => {

            const [

                totalTasks,

                completedTasks,

            ] = await Promise.all([

                Task.countDocuments({

                    project: project._id,

                    isDeleted: false,

                }),

                Task.countDocuments({

                    project: project._id,

                    status: "Done",

                    isDeleted: false,

                }),

            ]);

            return {

                ...project.toObject(),

                totalTasks,

                completedTasks,

                progress:

                    totalTasks === 0

                        ? 0

                        : Math.round(

                              (completedTasks / totalTasks) * 100

                          ),

            };

        })

    );

    return res.json(

        new ApiResponse(

            200,

            "Member projects fetched successfully",

            data

        )

    );

});


/*
|--------------------------------------------------------------------------
| GET
| /api/team/:id/tasks
|--------------------------------------------------------------------------
| Returns tasks assigned to a member
|--------------------------------------------------------------------------
*/

export const getMemberTasks = asyncHandler(async (req, res) => {

    const member = await User.findById(req.params.id);

    if (!member) {

        throw new ApiError(
            404,
            "Member not found"
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Verify Access
    |--------------------------------------------------------------------------
    */

    const hasAccess = await Project.exists({

        isDeleted: false,

        $and: [

            {
                $or: [

                    { owner: req.user._id },

                    { members: req.user._id },

                ],

            },

            {
                $or: [

                    { owner: member._id },

                    { members: member._id },

                ],

            },

        ],

    });

    if (!hasAccess) {

        throw new ApiError(

            403,

            "You are not authorized to view this member."

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Query Filters
    |--------------------------------------------------------------------------
    */

    const {

        page = 1,

        limit = 10,

        search = "",

        status,

        priority,

        project,

        sort = "-createdAt",

    } = req.query;

    const query = {

        assignedTo: member._id,

        isDeleted: false,

    };

    if (search) {

        query.$text = {

            $search: search,

        };

    }

    if (status) {

        query.status = status;

    }

    if (priority) {

        query.priority = priority;

    }

    if (project) {

        query.project = project;

    }

    const currentPage = Number(page);

    const perPage = Number(limit);

    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)

        .populate(
            "project",
            "name color status"
        )

        .populate(
            "assignedTo",
            "name avatar email"
        )

        .populate(
            "createdBy",
            "name avatar"
        )

        .sort(sort)

        .skip((currentPage - 1) * perPage)

        .limit(perPage);

    return res.json(

        new ApiResponse(

            200,

            "Member tasks fetched successfully",

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
| GET
| /api/team/:id/workload
|--------------------------------------------------------------------------
| Returns workload overview of a team member
|--------------------------------------------------------------------------
*/

export const getMemberWorkload = asyncHandler(async (req, res) => {

    const member = await User.findById(req.params.id)

        .select(
            "name email avatar role"
        );

 console.log("WORKLOAD API");
    if (!member) {

        throw new ApiError(

            404,

            "Member not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Verify Access
    |--------------------------------------------------------------------------
    */

    const hasAccess = await Project.exists({

        isDeleted: false,

        $and: [

            {

                $or: [

                    {
                        owner: req.user._id,
                    },

                    {
                        members: req.user._id,
                    },

                ],

            },

            {

                $or: [

                    {
                        owner: member._id,
                    },

                    {
                        members: member._id,
                    },

                ],

            },

        ],

    });


    if (!hasAccess) {

        throw new ApiError(

            403,

            "You are not authorized to view this member."

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Task Statistics
    |--------------------------------------------------------------------------
    */


    const [

        totalTasks,

        todoTasks,

        inProgressTasks,

        reviewTasks,

        completedTasks,

        overdueTasks,

        highPriorityTasks,

    ] = await Promise.all([


        Task.countDocuments({

            assignedTo: member._id,

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: member._id,

            status: "Todo",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: member._id,

            status: "In Progress",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: member._id,

            status: "Review",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: member._id,

            status: "Done",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: member._id,

            dueDate: {

                $lt: new Date(),

            },

            status: {

                $ne: "Done",

            },

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: member._id,

            priority: {

                $in: [

                    "High",

                    "Critical",

                ],

            },

            isDeleted: false,

        }),


    ]);



    /*
    |--------------------------------------------------------------------------
    | Project Statistics
    |--------------------------------------------------------------------------
    */


    const totalProjects = await Project.countDocuments({

        isDeleted: false,

        $or: [

            {
                owner: member._id,
            },

            {
                members: member._id,
            },

        ],

    });



    /*
    |--------------------------------------------------------------------------
    | Completion Percentage
    |--------------------------------------------------------------------------
    */


    const completionRate =

        totalTasks === 0

            ? 0

            :

            Math.round(

                (

                    completedTasks /

                    totalTasks

                ) * 100

            );



    return res.json(

        new ApiResponse(

            200,

            "Member workload fetched successfully",

            {

                member,


                workload: {

                    totalProjects,


                    totalTasks,


                    todoTasks,


                    inProgressTasks,


                    reviewTasks,


                    completedTasks,


                    overdueTasks,


                    highPriorityTasks,


                    completionRate,

                },

            }

        )

    );


});