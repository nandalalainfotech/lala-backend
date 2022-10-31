import mongoose from 'mongoose';
const videoSchema = new mongoose.Schema(
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
  const Video = mongoose.model('Video', videoSchema);
  export default Video;

