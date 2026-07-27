import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        status: {
            type: String,
            enum: ["Active", "Completed", "Archived", "Planning"],
            default: "Active",
        },

        color: {
            type: String,
            default: "#2563EB", // Tailwind Blue-600
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        startDate: {
            type: Date,
        },

        endDate: {
            type: Date,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

projectSchema.index({ name: "text", description: "text" });

export default mongoose.model("Project", projectSchema);