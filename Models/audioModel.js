// import mongoose from 'mongoose';
// const audioSchema = new mongoose.Schema(
//     {
//         fieldname: { String },
//         filename: { String },
//         originalname: { String },
//         content: { Buffer },
//         status: { String },
//         flag: { Boolean },
//         // reviews: [reviewSchema],

//     },
//     {
//         timestamps: true,
//     }
// );

// const Audios = mongoose.model('Audios', audioSchema);

// export default Audios;

import mongoose from 'mongoose';
const audioSchema = new mongoose.Schema(
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
  const Audio = mongoose.model('Audio', audioSchema);
  export default Audio;












