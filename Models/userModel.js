import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: true, required: true },
    isSeller: { type: Boolean,  required: true, default: false },
    seller: {
      name: String,
      logo1: String,
      logo2: String,
      logo3: String,
      logo4: String,
      description: String,

      rating: { type: Number, default: 3, required: true },
      numReviews: { type: Number, default: 3, required: true },
    },
  },
  {
    timestamps: true,
  },

);




const User = mongoose.model('User', userSchema);

export default User;