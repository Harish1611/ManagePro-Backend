import * as yup from "yup";


/*
|--------------------------------------------------------------------------
| Team Query Validation
|--------------------------------------------------------------------------
| GET /api/team
|
| Member listing filters
|--------------------------------------------------------------------------
*/

export const teamQuerySchema = yup.object({

    query: yup.object({

        page: yup
            .number()
            .transform((value, originalValue) =>
                originalValue === ""
                    ? 1
                    : value
            )
            .default(1),


        limit: yup
            .number()
            .transform((value, originalValue) =>
                originalValue === ""
                    ? 10
                    : value
            )
            .default(10),


        search: yup
            .string()
            .transform(value =>
                value === ""
                    ? undefined
                    : value
            )
            .optional(),


        role: yup
            .string()
            .oneOf([
                "Admin",
                "Manager",
                "Member",
            ])
            .transform(value =>
                value === ""
                    ? undefined
                    : value
            )
            .optional(),


        status: yup
            .string()
            .oneOf([
                "active",
                "inactive",
            ])
            .transform(value =>
                value === ""
                    ? undefined
                    : value
            )
            .optional(),


        sort: yup
            .string()
            .transform(value =>
                value === ""
                    ? "-createdAt"
                    : value
            )
            .default("-createdAt"),

    }),

});



/*
|--------------------------------------------------------------------------
| Member ID Validation
|--------------------------------------------------------------------------
| Used for:
|
| GET /api/team/:id
| GET /api/team/:id/projects
| GET /api/team/:id/tasks
| GET /api/team/:id/workload
|--------------------------------------------------------------------------
*/

export const memberIdSchema = yup.object({

    params: yup.object({

        id: yup
            .string()
            .required("Member ID is required"),

    }),

});



/*
|--------------------------------------------------------------------------
| Create Team Member
|--------------------------------------------------------------------------
| Future:
| POST /api/team
|--------------------------------------------------------------------------
*/

export const createTeamMemberSchema = yup.object({

    body: yup.object({

        name: yup
            .string()
            .required("Name is required")
            .min(2)
            .max(100),


        email: yup
            .string()
            .email("Invalid email")
            .required("Email is required"),


        password: yup
            .string()
            .required("Password is required")
            .min(6),


        phone: yup
            .string()
            .optional(),


        role: yup
            .string()
            .oneOf([
                "Admin",
                "Manager",
                "Member",
            ])
            .default("Member"),

    }),

});



/*
|--------------------------------------------------------------------------
| Update Team Member
|--------------------------------------------------------------------------
| Future:
| PUT /api/team/:id
|--------------------------------------------------------------------------
*/

export const updateTeamMemberSchema = yup.object({

    body: yup.object({

        name: yup
            .string()
            .min(2)
            .max(100)
            .optional(),


        phone: yup
            .string()
            .optional(),


        avatar: yup
            .string()
            .optional(),


        role: yup
            .string()
            .oneOf([
                "Admin",
                "Manager",
                "Member",
            ])
            .optional(),


        isActive: yup
            .boolean()
            .optional(),

    }),

});



/*
|--------------------------------------------------------------------------
| Member Tasks Query Validation
|--------------------------------------------------------------------------
| GET /api/team/:id/tasks
|--------------------------------------------------------------------------
*/

export const memberTaskQuerySchema = yup.object({

    query: yup.object({

        page: yup
            .number()
            .transform((value, originalValue) =>
                originalValue === ""
                    ? 1
                    : value
            )
            .default(1),


        limit: yup
            .number()
            .transform((value, originalValue) =>
                originalValue === ""
                    ? 10
                    : value
            )
            .default(10),


        search: yup
            .string()
            .transform(value =>
                value === ""
                    ? undefined
                    : value
            )
            .optional(),


        status: yup
            .string()
            .transform(value =>
                value === ""
                    ? undefined
                    : value
            )
            .optional(),


        priority: yup
            .string()
            .transform(value =>
                value === ""
                    ? undefined
                    : value
            )
            .optional(),


        project: yup
            .string()
            .transform(value =>
                value === ""
                    ? undefined
                    : value
            )
            .optional(),


        sort: yup
            .string()
            .default("-createdAt"),

    }),

});


/*
|--------------------------------------------------------------------------
| Export Default
|--------------------------------------------------------------------------
*/

export default {

    teamQuerySchema,

    memberIdSchema,

    createTeamMemberSchema,

    updateTeamMemberSchema,

    memberTaskQuerySchema,

};