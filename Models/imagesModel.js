


// // const imaSchema = new mongoose.Schema(
// //     {


// //         'contentid': {
// //             type: mongoose.Types.ObjectId,
// //             ref: 'images'
// //         },
// //         'fileid': {
// //             type: mongoose.Types.ObjectId,
// //             ref: 'uploads.files'
// //         },
// //         'fieldname': String,
// //         'filename': String,
// //         'originalname': String,
// //         'content': Buffer,
// //         'status': String,
// //         'flag': Boolean,

// //     },
// //     {
// //         timestamps: true,
// //     }
// // );



// // const Image = mongoose.model('Ima', imaSchema);

// // export default Image;

// import mongoose from 'mongoose';



// const reviewSchema = new mongoose.Schema(
//     {
//         name: { type: String, required: true },
//         comment: { type: String, required: true },
//         rating: { type: Number, required: true },
//     },
//     {
//         timestamps: true,
//     }
// );


// const imagesSchema = new mongoose.Schema(
//     {
//         fieldname: { type: String ,required: true},
//         filename: { type: String ,required: true},
//         originalname: { type: String ,required: true},
//         // content: { type: String ,required: true},
//         // status: { type: String ,required: true},
//         // flag: { type: String ,required: true},
//         // reviews: [reviewSchema],

//     },



   
//     {
//         timestamps: true,
//     }
// );

// const Images = mongoose.model('Images', imagesSchema);

// export default Images;


import mongoose from 'mongoose';
const imageSchema = new mongoose.Schema(
    {
      fieldname: { type: String, required: true },
      filename: { type: String, required: true },
      originalname: { type: String, required: true },
      path: { type: String, required: false },
      status: { type: String, required: false },
      // mimetype: { type: String, required: true },
      // encoding: { type: String, required: true },
      flag: { type: Boolean, required: false },
    },
    {
      timestamps: true,
    },
  );
  const Image = mongoose.model('Image', imageSchema);
  export default Image;
