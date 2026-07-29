import * as yup from "yup";


/*
|--------------------------------------------------------------------------
| Update Profile
|--------------------------------------------------------------------------
*/

export const updateProfileSchema = yup.object({

    name: yup
        .string()
        .trim()
        .required("Name is required")
        .min(
            3,
            "Name must be at least 3 characters"
        )
        .max(
            100,
            "Name cannot exceed 100 characters"
        ),

    phone: yup
        .string()
        .trim()
        .nullable()
        .transform((value, originalValue) =>

            originalValue === ""

                ? null

                : value

        )
        .matches(

            /^[0-9+\-\s()]*$/,

            "Enter a valid phone number"

        )
        .max(
            20,
            "Phone number cannot exceed 20 characters"
        ),

    avatar: yup
        .string()
        .trim()
        .nullable()
        .transform((value, originalValue) =>

            originalValue === ""

                ? ""

                : value

        )
        .url("Enter a valid avatar URL"),

});


/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

export const changePasswordSchema = yup.object({

    currentPassword: yup
        .string()
        .required("Current password is required"),

    newPassword: yup
        .string()
        .required("New password is required")
        .min(
            6,
            "Password must be at least 6 characters"
        )
        .max(
            100,
            "Password cannot exceed 100 characters"
        )
        .notOneOf(

            [

                yup.ref("currentPassword"),

            ],

            "New password must be different from current password"

        ),

    confirmPassword: yup
        .string()
        .required("Confirm password is required")
        .oneOf(

            [

                yup.ref("newPassword"),

            ],

            "Passwords do not match"

        ),

});