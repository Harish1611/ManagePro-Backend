import * as yup from "yup";

import {
    TASK_STATUS,
    TASK_PRIORITY,
} from "../constants/taskConstants.js";

/*
|--------------------------------------------------------------------------
| Create Task
|--------------------------------------------------------------------------
*/

export const createTaskSchema = yup.object({

    title: yup
        .string()
        .required("Task title is required")
        .min(3, "Minimum 3 characters")
        .max(150, "Maximum 150 characters"),

    description: yup
        .string()
        .max(3000, "Maximum 3000 characters")
        .optional(),

    project: yup
        .string()
        .required("Project is required"),

    assignedTo: yup
        .string()
        .required("Assignee is required"),

    priority: yup
        .string()
        .oneOf(TASK_PRIORITY)
        .default("Medium"),

    status: yup
        .string()
        .oneOf(TASK_STATUS)
        .default("Todo"),

    dueDate: yup
        .date()
        .nullable()
        .transform((value, originalValue) =>
            originalValue === ""
                ? null
                : value
        ),

});

/*
|--------------------------------------------------------------------------
| Update Task
|--------------------------------------------------------------------------
*/

export const updateTaskSchema = yup.object({

    title: yup
        .string()
        .min(3)
        .max(150)
        .optional(),

    description: yup
        .string()
        .max(3000)
        .optional(),

    project: yup
        .string()
        .optional(),

    assignedTo: yup
        .string()
        .optional(),

    priority: yup
        .string()
        .oneOf(TASK_PRIORITY)
        .optional(),

    status: yup
        .string()
        .oneOf(TASK_STATUS)
        .optional(),

    dueDate: yup
        .date()
        .nullable()
        .optional(),

});

/*
|--------------------------------------------------------------------------
| Query Validation
|--------------------------------------------------------------------------
*/

export const taskQuerySchema = yup.object({

    query: yup.object({

        page: yup
            .number()
            .transform((value, originalValue) =>
                originalValue === "" ? 1 : value
            )
            .default(1),

        limit: yup
            .number()
            .transform((value, originalValue) =>
                originalValue === "" ? 10 : value
            )
            .default(10),

        search: yup
            .string()
            .transform(value =>
                value === "" ? undefined : value
            )
            .optional(),

        project: yup
            .string()
            .transform(value =>
                value === "" ? undefined : value
            )
            .optional(),

        assignedTo: yup
            .string()
            .transform(value =>
                value === "" ? undefined : value
            )
            .optional(),

        priority: yup
            .string()
            .transform(value =>
                value === "" ? undefined : value
            )
            .oneOf(TASK_PRIORITY)
            .optional(),

        status: yup
            .string()
            .transform(value =>
                value === "" ? undefined : value
            )
            .oneOf(TASK_STATUS)
            .optional(),

        sort: yup
            .string()
            .transform(value =>
                value === "" ? "-createdAt" : value
            )
            .default("-createdAt"),

    }),

});