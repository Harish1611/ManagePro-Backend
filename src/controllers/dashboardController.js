import Project from "../models/Project.js";
import Task from "../models/Task.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

/*
|--------------------------------------------------------------------------
| GET
| /api/dashboard
|--------------------------------------------------------------------------
*/

export const getDashboard = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    /*
    |--------------------------------------------------------------------------
    | Accessible Projects
    |--------------------------------------------------------------------------
    */

    const projects = await Project.find({

        isDeleted: false,

        $or: [

            { owner: userId },

            { members: userId },

        ],

    }).select("_id name status");

    const projectIds = projects.map(project => project._id);

    /*
    |--------------------------------------------------------------------------
    | Summary
    |--------------------------------------------------------------------------
    */

    const [

        totalProjects,

        activeProjects,

        totalTasks,

        completedTasks,

        overdueTasks,

        myTasks,

    ] = await Promise.all([

        Project.countDocuments({

            isDeleted: false,

            $or: [

                { owner: userId },

                { members: userId },

            ],

        }),

        Project.countDocuments({

            isDeleted: false,

            status: "Active",

            $or: [

                { owner: userId },

                { members: userId },

            ],

        }),

        Task.countDocuments({

            isDeleted: false,

            project: {

                $in: projectIds,

            },

        }),

        Task.countDocuments({

            isDeleted: false,

            status: "Done",

            project: {

                $in: projectIds,

            },

        }),

        Task.countDocuments({

            isDeleted: false,

            dueDate: {

                $lt: new Date(),

            },

            status: {

                $ne: "Done",

            },

            project: {

                $in: projectIds,

            },

        }),

        Task.countDocuments({

            isDeleted: false,

            assignedTo: userId,

        }),

    ]);

    /*
    |--------------------------------------------------------------------------
    | Tasks By Status
    |--------------------------------------------------------------------------
    */

    const statusChart = await Task.aggregate([

        {

            $match: {

                isDeleted: false,

                project: {

                    $in: projectIds,

                },

            },

        },

        {

            $group: {

                _id: "$status",

                count: {

                    $sum: 1,

                },

            },

        },

        {

            $project: {

                _id: 0,

                status: "$_id",

                count: 1,

            },

        },

    ]);

    /*
    |--------------------------------------------------------------------------
    | Tasks By Priority
    |--------------------------------------------------------------------------
    */

    const priorityChart = await Task.aggregate([

        {

            $match: {

                isDeleted: false,

                project: {

                    $in: projectIds,

                },

            },

        },

        {

            $group: {

                _id: "$priority",

                count: {

                    $sum: 1,

                },

            },

        },

        {

            $project: {

                _id: 0,

                priority: "$_id",

                count: 1,

            },

        },

    ]);

    /*
    |--------------------------------------------------------------------------
    | Recent Projects
    |--------------------------------------------------------------------------
    */

    const recentProjects = await Project.find({

        isDeleted: false,

        $or: [

            { owner: userId },

            { members: userId },

        ],

    })

        .populate("owner", "name avatar")

        .sort("-createdAt")

        .limit(5);

    /*
    |--------------------------------------------------------------------------
    | Recent Tasks
    |--------------------------------------------------------------------------
    */

    const recentTasks = await Task.find({

        isDeleted: false,

        project: {

            $in: projectIds,

        },

    })

        .populate("project", "name color")

        .populate("assignedTo", "name avatar")

        .sort("-createdAt")

        .limit(5);

    /*
    |--------------------------------------------------------------------------
    | Project Progress
    |--------------------------------------------------------------------------
    */

    const projectProgress = await Promise.all(

        projects.map(async (project) => {

            const total = await Task.countDocuments({

                project: project._id,

                isDeleted: false,

            });

            const completed = await Task.countDocuments({

                project: project._id,

                status: "Done",

                isDeleted: false,

            });

            return {

                _id: project._id,

                name: project.name,

                total,

                completed,

                progress:

                    total === 0

                        ? 0

                        : Math.round(

                            (completed / total) * 100

                        ),

            };

        })

    );

    return res.json(

        new ApiResponse(

            200,

            "Dashboard fetched successfully",

            {

                summary: {

                    totalProjects,

                    activeProjects,

                    totalTasks,

                    completedTasks,

                    overdueTasks,

                    myTasks,

                },

                statusChart,

                priorityChart,

                projectProgress,

                recentProjects,

                recentTasks,

            }

        )

    );

});