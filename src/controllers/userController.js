import User from "../models/User.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

/*
|--------------------------------------------------------------------------
| GET
| /api/users
|--------------------------------------------------------------------------
*/

export const getUsers = asyncHandler(async (req, res) => {

    const {
        search = "",
    } = req.query;

    const query = {
        isActive: true,
        _id: {
            $ne: req.user._id,
        },
    };

    if (search) {
        query.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                email: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }

    const users = await User.find(query)
        .select(
            "name email avatar role isActive createdAt"
        )
        .sort({
            name: 1,
        });

    return res.json(

        new ApiResponse(

            200,

            "Users fetched successfully",

            users

        )

    );

});

/*
|--------------------------------------------------------------------------
| GET
| /api/users/:id
|--------------------------------------------------------------------------
*/

export const getUser = asyncHandler(async (req, res) => {

    const user = await User.findOne({

        _id: req.params.id,

        isActive: true,

    }).select(

        "name email phone avatar role isActive createdAt updatedAt"

    );

    if (!user) {

        throw new ApiError(

            404,

            "User not found"

        );

    }

    return res.json(

        new ApiResponse(

            200,

            "User fetched successfully",

            user

        )

    );

});