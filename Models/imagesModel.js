import mongoose from 'mongoose';
const imageSchema = new mongoose.Schema(
  
    {
      fieldname: { type: String, required: true },
      filename: { type: String, required: true },
      originalname: { type: String, required: true },
      path: { type: String, required: false },
      status: { type: String, required: false },
      mimetype: { type: String, required: false },
      encoding: { type: String, required: false },
      flag: { type: Boolean, required: false },
      
    },
    {
      timestamps: true,
    },
  
  );
  
  
  
  
  const Image = mongoose.model('Image', imageSchema);
  
  export default Image;