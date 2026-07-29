import User from "../models/User.js";

import Project from "../models/Project.js";

import Task from "../models/Task.js";

import asyncHandler from "../utils/asyncHandler.js";

import ApiResponse from "../utils/ApiResponse.js";

import ApiError from "../utils/ApiError.js";

import fs from "fs/promises";

import path from "path";

/*
|--------------------------------------------------------------------------
| GET
| /api/profile
|--------------------------------------------------------------------------
*/

export const getProfile = asyncHandler(async (req, res) => {

    const userId = req.user._id;


    /*
    |--------------------------------------------------------------------------
    | Fetch User
    |--------------------------------------------------------------------------
    */

    const user = await User.findById(

        userId

    ).select(

        "name email phone avatar role isActive createdAt updatedAt"

    );


    if (!user) {

        throw new ApiError(

            404,

            "User not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Task Statistics
    |--------------------------------------------------------------------------
    */

    const [

        tasksCount,

        todoTasks,

        inProgressTasks,

        reviewTasks,

        completedTasks,

        overdueTasks,

        highPriorityTasks,

    ] = await Promise.all([

        Task.countDocuments({

            assignedTo: userId,

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: userId,

            status: "Todo",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: userId,

            status: "In Progress",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: userId,

            status: "Review",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: userId,

            status: "Done",

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: userId,

            dueDate: {

                $lt: new Date(),

            },

            status: {

                $ne: "Done",

            },

            isDeleted: false,

        }),


        Task.countDocuments({

            assignedTo: userId,

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

    const projectsCount = await Project.countDocuments({

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


    /*
    |--------------------------------------------------------------------------
    | Pending Tasks
    |--------------------------------------------------------------------------
    */

    const pendingTasks =

        todoTasks +

        inProgressTasks +

        reviewTasks;


    /*
    |--------------------------------------------------------------------------
    | Completion Percentage
    |--------------------------------------------------------------------------
    */

    const completionPercentage =

        tasksCount === 0

            ? 0

            : Math.round(

                (

                    completedTasks /

                    tasksCount

                ) * 100

            );


    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.json(

        new ApiResponse(

            200,

            "Profile fetched successfully",

            {

                ...user.toObject(),

                statistics: {

                    projectsCount,

                    tasksCount,

                    todoTasks,

                    inProgressTasks,

                    reviewTasks,

                    completedTasks,

                    pendingTasks,

                    overdueTasks,

                    highPriorityTasks,

                    completionPercentage,

                },

            }

        )

    );

});
/*
|--------------------------------------------------------------------------
| PUT
| /api/profile
|--------------------------------------------------------------------------
*/

export const updateProfile = asyncHandler(async (req, res) => {

    const {

        name,

        phone,

        avatar,

    } = req.body;


    const user = await User.findById(

        req.user._id

    );


    if (!user) {

        throw new ApiError(

            404,

            "User not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Update Fields
    |--------------------------------------------------------------------------
    */

    if (name !== undefined) {

        user.name = name.trim();

    }


    if (phone !== undefined) {

        user.phone = phone || "";

    }


    if (avatar !== undefined) {

        user.avatar = avatar || "";

    }


    await user.save();


    const updatedProfile = {

        _id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        avatar: user.avatar,

        role: user.role,

        createdAt: user.createdAt,

        updatedAt: user.updatedAt,

    };


    return res.status(200).json(

        new ApiResponse(

            200,

            "Profile updated successfully",

            updatedProfile

        )

    );

});


/*
|--------------------------------------------------------------------------
| PUT
| /api/profile/password
|--------------------------------------------------------------------------
*/

export const changePassword = asyncHandler(async (req, res) => {

    const {

        currentPassword,

        newPassword,

    } = req.body;


    /*
    |--------------------------------------------------------------------------
    | Fetch User With Password
    |--------------------------------------------------------------------------
    */

    const user = await User.findById(

        req.user._id

    ).select("+password");


    if (!user) {

        throw new ApiError(

            404,

            "User not found"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Verify Current Password
    |--------------------------------------------------------------------------
    */

    const currentPasswordMatched = await user.matchPassword(

        currentPassword

    );


    if (!currentPasswordMatched) {

        throw new ApiError(

            400,

            "Current password is incorrect"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Prevent Reusing Current Password
    |--------------------------------------------------------------------------
    */

    const samePassword = await user.matchPassword(

        newPassword

    );


    if (samePassword) {

        throw new ApiError(

            400,

            "New password must be different from current password"

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Update Password
    |--------------------------------------------------------------------------
    */

    user.password = newPassword;

    await user.save();


    return res.status(200).json(

        new ApiResponse(

            200,

            "Password changed successfully",

            null

        )

    );

});



/*
|--------------------------------------------------------------------------
| Delete Local Avatar
|--------------------------------------------------------------------------
*/

const deleteLocalAvatar = async (avatar) => {

    if (!avatar) {

        return;

    }


    if (

        avatar.startsWith("http://") ||

        avatar.startsWith("https://")

    ) {

        return;

    }


    const normalizedAvatar = avatar.replace(

        /^\/+/,

        ""

    );


    if (!normalizedAvatar.startsWith("uploads/avatars/")) {

        return;

    }


    const avatarPath = path.join(

        process.cwd(),

        normalizedAvatar

    );


    try {

        await fs.unlink(

            avatarPath

        );

    } catch (error) {

        if (error.code !== "ENOENT") {

            console.error(

                "Failed to remove previous avatar:",

                error

            );

        }

    }

};


/*
|--------------------------------------------------------------------------
| POST
| /api/profile/avatar
|--------------------------------------------------------------------------
*/

export const uploadProfileAvatar = asyncHandler(async (req, res) => {

    if (!req.file) {

        throw new ApiError(

            400,

            "Please select an avatar image."

        );

    }


    const user = await User.findById(

        req.user._id

    );


    if (!user) {

        await fs.unlink(

            req.file.path

        ).catch(() => {});

        throw new ApiError(

            404,

            "User not found."

        );

    }


    const previousAvatar = user.avatar;


    const avatar = `/uploads/avatars/${req.file.filename}`;


    user.avatar = avatar;


    await user.save({

        validateBeforeSave: false,

    });


    if (

        previousAvatar &&

        previousAvatar !== avatar

    ) {

        await deleteLocalAvatar(

            previousAvatar

        );

    }


    return res.status(200).json(

        new ApiResponse(

            200,

            "Avatar uploaded successfully",

            {

                avatar: user.avatar,

            }

        )

    );

});


/*
|--------------------------------------------------------------------------
| DELETE
| /api/profile/avatar
|--------------------------------------------------------------------------
*/

export const removeProfileAvatar = asyncHandler(async (req, res) => {

    const user = await User.findById(

        req.user._id

    );


    if (!user) {

        throw new ApiError(

            404,

            "User not found."

        );

    }


    const previousAvatar = user.avatar;


    user.avatar = "";


    await user.save({

        validateBeforeSave: false,

    });


    await deleteLocalAvatar(

        previousAvatar

    );


    return res.status(200).json(

        new ApiResponse(

            200,

            "Avatar removed successfully",

            {

                avatar: "",

            }

        )

    );

});