import mongoose from 'mongoose';

const filesSchema = new mongoose.Schema(
    {
        fieldname: { String },
        filename: { String },
        originalname: { String },
        content: { Buffer },
        status: { String },
        flag: { Boolean },
        // reviews: [reviewSchema],

    },
    {
        timestamps: true,
    }
);
// const filesSchema = new mongoose.Schema(
//     {


//         'contentid': {
//             type: mongoose.Types.ObjectId,
//             ref: 'uploadfiles'
//         },
//         'fileid': {
//             type: mongoose.Types.ObjectId,
//             ref: 'uploads.files'
//         },
//         'fieldname': String,
//         'filename': String,
//         'originalname': String,
//         'content': Buffer,
//         'status': String,
//         'flag': Boolean,

//     },
//     {
//         timestamps: true,
//     }
// );



// const Image = mongoose.model('Images', imagesSchema);

// export default Image;
const Files = mongoose.model('Files', filesSchema);

export default Files;