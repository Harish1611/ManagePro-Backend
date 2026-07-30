import mongoose from "mongoose";


const activitySchema = new mongoose.Schema(

    {

        actor: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true,

            index: true,

        },


        action: {

            type: String,

            required: true,

            enum: [

                "PROJECT_CREATED",

                "PROJECT_UPDATED",

                "PROJECT_DELETED",

                "PROJECT_MEMBER_ADDED",

                "PROJECT_MEMBER_REMOVED",

                "TASK_CREATED",

                "TASK_UPDATED",

                "TASK_DELETED",

                "TASK_ASSIGNED",

                "TASK_STATUS_CHANGED",

                "ATTACHMENT_UPLOADED",

                "ATTACHMENT_DELETED",

                "PROFILE_UPDATED",

            ],

            index: true,

        },


        entityType: {

            type: String,

            required: true,

            enum: [

                "project",

                "task",

                "user",

                "attachment",

            ],

            index: true,

        },


        entityId: {

            type: mongoose.Schema.Types.ObjectId,

            required: true,

            index: true,

        },


        project: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Project",

            default: null,

            index: true,

        },


        task: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "Task",

            default: null,

            index: true,

        },


        targetUser: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            default: null,

            index: true,

        },


        message: {

            type: String,

            required: true,

            trim: true,

        },


        metadata: {

            type: mongoose.Schema.Types.Mixed,

            default: {},

        },

    },

    {

        timestamps: true,

    }

);


activitySchema.index({

    project: 1,

    createdAt: -1,

});


activitySchema.index({

    task: 1,

    createdAt: -1,

});


activitySchema.index({

    actor: 1,

    createdAt: -1,

});


activitySchema.index({

    targetUser: 1,

    createdAt: -1,

});


const Activity = mongoose.model(

    "Activity",

    activitySchema

);


export default Activity;