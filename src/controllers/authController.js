import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

import asyncHandler from "../utils/asyncHandler.js";

import ApiResponse from "../utils/ApiResponse.js";

import ApiError from "../utils/ApiError.js";

/*
    POST
    /api/auth/register
*/

export const registerUser = asyncHandler(async (req, res) => {

    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "Please fill all required fields");
    }

    const exists = await User.findOne({ email });

    if (exists) {
        throw new ApiError(400, "Email already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        phone,
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            "Registration successful",
            {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                token: generateToken(user._id),
            }
        )
    );

});

/*
    POST
    /api/auth/login
*/

export const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({
        email,
    }).select("+password");

    if (!user) {
        throw new ApiError(
            401,
            "Invalid email or password"
        );
    }

    const matched = await user.matchPassword(password);

    if (!matched) {
        throw new ApiError(
            401,
            "Invalid email or password"
        );
    }

    return res.json(
        new ApiResponse(
            200,
            "Login successful",
            {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                phone: user.phone,
                token: generateToken(user._id),
            }
        )
    );

});

/*
    GET
    /api/auth/me
*/

export const getProfile = asyncHandler(async (req, res) => {

    return res.json(
        new ApiResponse(
            200,
            "Profile fetched successfully",
            req.user
        )
    );

});