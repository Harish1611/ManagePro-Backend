import multer from "multer";

import path from "path";

import crypto from "crypto";

import fs from "fs";


/*
|--------------------------------------------------------------------------
| Upload Directories
|--------------------------------------------------------------------------
*/

const avatarUploadDirectory = path.join(

    process.cwd(),

    "uploads",

    "avatars"

);


const attachmentUploadDirectory = path.join(

    process.cwd(),

    "uploads",

    "attachments"

);


[

    avatarUploadDirectory,

    attachmentUploadDirectory,

].forEach((directory) => {

    if (!fs.existsSync(directory)) {

        fs.mkdirSync(

            directory,

            {
                recursive: true,
            }

        );

    }

});


/*
|--------------------------------------------------------------------------
| Avatar Storage
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
| Attachment Storage
|--------------------------------------------------------------------------
*/

const attachmentStorage = multer.diskStorage({

    destination: (

        req,

        file,

        callback

    ) => {

        callback(

            null,

            attachmentUploadDirectory

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

            "attachment",

            req.params?.taskId || "task",

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
| Avatar File Filter
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
| Attachment File Filter
|--------------------------------------------------------------------------
*/

const attachmentFileFilter = (

    req,

    file,

    callback

) => {

    const allowedMimeTypes = [

        "image/jpeg",

        "image/jpg",

        "image/png",

        "image/webp",

        "application/pdf",

    ];


    if (!allowedMimeTypes.includes(file.mimetype)) {

        return callback(

            new Error(

                "Only JPG, JPEG, PNG, WEBP, and PDF files are allowed."

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


/*
|--------------------------------------------------------------------------
| Task Attachment Upload
|--------------------------------------------------------------------------
*/

export const taskAttachmentUpload = multer({

    storage: attachmentStorage,

    fileFilter: attachmentFileFilter,

    limits: {

        fileSize:

            5 *

            1024 *

            1024,

        files: 1,

    },

});