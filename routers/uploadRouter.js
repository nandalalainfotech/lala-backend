// import multer from 'multer';
// import express from 'express';
// import { isAuth } from '../utils.js';

// const uploadRouter = express.Router();

// const storage = multer.diskStorage({

//   destination(req, file, cb) {
//     console.log('multer');

//     cb(null, 'uploads/');
//   },
//   filename(req, file, cb) {

//     cb(null, `${Date.now()}.jpg`);
//   },
// });

// const upload = multer({ storage });

// uploadRouter.post('/', isAuth, upload.single('image'), (req, res) => {

//   res.send(`/${req.file.path}`);
// });

// export default uploadRouter;








// import multer from "multer";
// import express from "express";
// import { isAuth } from '../utils.js';
// import path from "path";
// import { GridFsStorage } from "multer-gridfs-storage";
// import crypto from "crypto";

// import Images from "../Models/imagesmodel.js";


// const uploadRouter = express.Router();
// const url = 'mongodb://localhost:27017';
// const storage = new GridFsStorage({

//   url: url,
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       crypto.randomBytes(16, (err, buf) => {
//         if (err) {
//           return reject(err);
//         }
//         const filename = buf.toString('hex') + path.extname(file.originalname);
//         const fileInfo = {
//           filename: filename,
//           bucketName: 'uploads',
//         };
//         resolve(fileInfo);
//       });
//     });
//   },
// });
// console.log("STORAGE");
// const upload = multer({ storage });

// uploadRouter.post('/', isAuth, upload.single('image'), (async (req, res) => {


//   const extension = req.file.originalname.split('.')[1]

//   // if(file){
//   const image = new Images({
//     content: req.file.path,
//     fieldname: req.file.fieldname,
//     originalname: req.file.originalname,
//     filename: req.file.filename,
//     status: req.body.status,
//     // mimetype : req.body.mimetype,
//     // encoding : req.body.encoding,
//   });
//   const imageUploaded = await image.save();
//   res.send({ message: 'Image Uploaded', image: imageUploaded });
//   //   }
//   //  else{
//   //   console.log("this is not image file==>");
//   //  }
// })
// );


// export default uploadRouter;




import multer from 'multer';
import express from 'express';
import { isAuth } from '../utils.js';
import upload from "../middleware/audio.js";
import Images from '../Models/imagesModel.js';

const uploadRouter = express.Router();
uploadRouter.post('/', isAuth, upload.single('image'),(async (req, res) => {
  console.log("file upload==>",req.file);
  const extension = req.file.originalname.split('.')[1]
  console.log("extension==>",extension);
  const image = new Images({
    content:req.file.path,
    fieldname : req.file.fieldname,
    originalname : req.file.originalname,
    filename : req.file.filename,
    status : req.body.status,
    // mimetype : req.body.mimetype,
    // encoding : req.body.encoding,
  });
  const imageUploaded = await image.save();
  res.send({ message: 'Image Uploaded', image: imageUploaded });
})
);
export default uploadRouter;














