import multer from "multer";

import path from "path";

import crypto from "crypto";

import fs from "fs";


/*
|--------------------------------------------------------------------------
| Avatar Upload Directory
|--------------------------------------------------------------------------
*/

const avatarUploadDirectory = path.join(

    process.cwd(),

    "uploads",

    "avatars"

);


if (!fs.existsSync(avatarUploadDirectory)) {

    fs.mkdirSync(

        avatarUploadDirectory,

        {
            recursive: true,
        }

    );

}


/*
|--------------------------------------------------------------------------
| Storage
|--------------------------------------------------------------------------
*/

const avatarStorage = multer.diskStorage({

    destination: (

        req,

        file,

        callback

    ) => {

        callback(

            null,

            avatarUploadDirectory

        );

    },

    filename: (

        req,

        file,

        callback

    ) => {

        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const uniqueName = [

            "avatar",

            req.user?._id,

            Date.now(),

            crypto.randomBytes(6).toString("hex"),

        ].join("-");

        callback(

            null,

            `${uniqueName}${extension}`

        );

    },

});


/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const avatarFileFilter = (

    req,

    file,

    callback

) => {

    const allowedMimeTypes = [

        "image/jpeg",

        "image/jpg",

        "image/png",

        "image/webp",

    ];


    if (!allowedMimeTypes.includes(file.mimetype)) {

        return callback(

            new Error(

                "Only JPG, JPEG, PNG, and WEBP images are allowed."

            ),

            false

        );

    }


    callback(

        null,

        true

    );

};


/*
|--------------------------------------------------------------------------
| Avatar Upload
|--------------------------------------------------------------------------
*/

export const avatarUpload = multer({

    storage: avatarStorage,

    fileFilter: avatarFileFilter,

    limits: {

        fileSize:

            5 *

            1024 *

            1024,

    },

});