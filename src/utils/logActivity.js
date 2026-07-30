import Activity from "../models/Activity.js";


const logActivity = async ({

    actor,

    action,

    entityType,

    entityId,

    message,

    project = null,

    task = null,

    targetUser = null,

    metadata = {},

}) => {

    if (

        !actor ||

        !action ||

        !entityType ||

        !entityId ||

        !message

    ) {

        return null;

    }


    try {

        return await Activity.create({

            actor,

            action,

            entityType,

            entityId,

            message,

            project,

            task,

            targetUser,

            metadata,

        });

    }

    catch (error) {

        console.error(

            "Activity logging failed:",

            error.message

        );


        return null;

    }

};


export default logActivity;