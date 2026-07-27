import Project from "../models/Project.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

/*
    POST
    /api/projects
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
    GET
    /api/projects
*/
export const getProjects = asyncHandler(async (req, res) => {

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

    if (search) {
        query.$text = {
            $search: search,
        };
    }

    if (status) {
        query.status = status;
    }

    const currentPage = Number(page);
    const perPage = Number(limit);

    const total = await Project.countDocuments(query);

    const projects = await Project.find(query)
        .populate("owner", "name email avatar")
        .populate("members", "name email avatar")
        .sort(sort)
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

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
                    totalPages: Math.ceil(total / perPage),
                },
            }
        )
    );

});

/*
    GET
    /api/projects/:id
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
    PUT
    /api/projects/:id
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

    Object.assign(project, req.body);

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
    DELETE
    /api/projects/:id
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