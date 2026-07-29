import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";


/**
 * Validate Request Middleware
 *
 * Usage:
 * validateRequest(schema)
 * validateRequest(schema, "query")
 * validateRequest(schema, "params")
 */

const validateRequest = (
    schema,
    property = "body"
) => {

    return asyncHandler(async (req, res, next) => {

        try {

            const validatedData = await schema.validate(

                req[property],

                {
                    abortEarly: false,
                    stripUnknown: true,
                }

            );


            /*
            |--------------------------------------------------------------------------
            | Update validated data
            |--------------------------------------------------------------------------
            */

            if (property === "query") {

                /*
                Express 5 req.query is readonly
                */

                Object.assign(
                    req.query,
                    validatedData
                );

            }

            else {

                req[property] = validatedData;

            }


            next();


        }

        catch (error) {

            const errors = error.errors || [

                error.message

            ];


            throw new ApiError(

                400,

                errors.join(", ")

            );

        }

    });

};


export default validateRequest;