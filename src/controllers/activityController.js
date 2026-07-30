import mongoose from "mongoose";

import Activity from "../models/Activity.js";

import Project from "../models/Project.js";

import asyncHandler from "../utils/asyncHandler.js";

import ApiError from "../utils/ApiError.js";

import ApiResponse from "../utils/ApiResponse.js";


/*
|--------------------------------------------------------------------------
| Get Activities
|--------------------------------------------------------------------------
*/

export const getActivities = asyncHandler(

    async (

        req,

        res

    ) => {

        const {

            page = 1,

            limit = 20,

            action,

            entityType,

            project,

            task,

            user,

        } = req.query;


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

            }).select("_id");


        const projectIds =

            accessibleProjects.map(

                (item) =>

                    item._id

            );


        const query = {

            $or: [

                {

                    project: {

                        $in: projectIds,

                    },

                },

                {

                    actor:

                        req.user._id,

                },

                {

                    targetUser:

                        req.user._id,

                },

            ],

        };


        if (action) {

            query.action = action;

        }


        if (entityType) {

            query.entityType =

                entityType;

        }


        if (project) {

            if (

                !mongoose.Types.ObjectId.isValid(

                    project

                )

            ) {

                throw new ApiError(

                    400,

                    "Invalid project ID"

                );

            }


            const canAccessProject =

                projectIds.some(

                    (projectId) =>

                        projectId.toString() ===

                        project

                );


            if (!canAccessProject) {

                throw new ApiError(

                    403,

                    "You do not have access to this project"

                );

            }


            query.project = project;

        }


        if (task) {

            query.task = task;

        }


        if (user) {

            query.$and = [

                {

                    $or: [

                        {

                            actor: user,

                        },

                        {

                            targetUser: user,

                        },

                    ],

                },

            ];

        }


        const currentPage =

            Math.max(

                Number(page) || 1,

                1

            );


        const perPage =

            Math.min(

                Math.max(

                    Number(limit) || 20,

                    1

                ),

                100

            );


        const [

            total,

            activities,

        ] = await Promise.all([

            Activity.countDocuments(

                query

            ),

            Activity.find(query)

                .populate(

                    "actor",

                    "name email avatar"

                )

                .populate(

                    "targetUser",

                    "name email avatar"

                )

                .populate(

                    "project",

                    "name color"

                )

                .populate(

                    "task",

                    "title status priority"

                )

                .sort({

                    createdAt: -1,

                })

                .skip(

                    (

                        currentPage -

                        1

                    ) *

                        perPage

                )

                .limit(perPage)

                .lean(),

        ]);


        return res.json(

            new ApiResponse(

                200,

                "Activities fetched successfully",

                {

                    activities,

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

    }

);