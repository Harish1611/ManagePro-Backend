import * as yup from "yup";

export const createProjectSchema = yup.object({

    name: yup
        .string()
        .required("Project name is required")
        .min(3, "Minimum 3 characters")
        .max(100, "Maximum 100 characters"),


    description: yup
        .string()
        .max(1000, "Maximum 1000 characters")
        .optional(),


    status: yup
        .string()
        .oneOf([
            "Active",
            "Completed",
            "Archived",
            "Planning",
        ])
        .optional(),


    color: yup
        .string()
        .matches(
            /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            "Invalid color"
        )
        .optional(),


    startDate: yup
        .date()
        .nullable()
        .optional(),


    endDate: yup
        .date()
        .nullable()
        .optional(),

});

export const updateProjectSchema = yup.object({

    name: yup
        .string()
        .min(3)
        .max(100)
        .optional(),


    description: yup
        .string()
        .max(1000)
        .optional(),


    status: yup
        .string()
        .oneOf([
            "Active",
            "Completed",
            "Archived",
            "Planning",
        ])
        .optional(),


    color: yup
        .string()
        .matches(
            /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            "Invalid color"
        )
        .optional()

});


export const projectQuerySchema = yup.object({
    query: yup.object({
        page: yup.number().default(1),

        limit: yup.number().default(10),

        search: yup.string().optional(),

        status: yup
            .string()
            .oneOf([
                "Active",
                "Completed",
                "Archived",
                "Planning",
            ])
            .optional(),

        sort: yup.string().optional(),
    }),
});