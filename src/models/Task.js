import mongoose from "mongoose";

import {
    TASK_STATUS,
    TASK_PRIORITY,
} from "../constants/taskConstants.js";

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: "",
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        priority: {
            type: String,
            enum: TASK_PRIORITY,
            default: "Medium",
        },

        status: {
            type: String,
            enum: TASK_STATUS,
            default: "Todo",
        },

        dueDate: {
            type: Date,
            default: null,
        },

        attachments: [
            {
                fileName: String,

                fileUrl: String,

                fileSize: Number,

                mimeType: String,

                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

taskSchema.index({
    title: "text",
    description: "text",
});

taskSchema.index({
    project: 1,
    status: 1,
});

taskSchema.index({
    assignedTo: 1,
});

taskSchema.index({
    createdBy: 1,
});

taskSchema.index({
    dueDate: 1,
});

taskSchema.index({
    priority: 1,
});

export default mongoose.model(
    "Task",
    taskSchema
);