import multer from 'multer';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth } from '../utils.js';
import upload from "../middleware/image.js";
import Image from '../Models/imagesModel.js';
import Grid from 'gridfs-stream';
import mongoose from 'mongoose';
import Product from '../Models/productModel.js';

const uploadRouter = express.Router();

uploadRouter.post('/', isAuth, upload.single('image'), (async(req, res) => {
    const image = new Image({
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        filename: req.file.filename,
        status: req.body.status,
        // mimetype : req.body.mimetype,
        // encoding : req.body.encoding,
    });
    const imageUploaded = await image.save();
    res.send({ message: 'image Uploaded', image: imageUploaded });
}));

uploadRouter.put('/:id', isAuth, upload.single('image'), (async(req, res) => {
    const imageId = req.params.id;
    const image = await Image.findById(imageId);
    if (image) {
        image.fieldname = req.file.fieldname;
        image.originalname = req.file.originalname;
        image.filename = req.file.filename;
        image.status = req.body.status;
        const updateImage = await image.save();
        res.send({ message: 'image Updated', image: updateImage });
    } else {
        res.status(404).send({ message: 'Image Not Found' });
    }
}));

uploadRouter.get('/list', expressAsyncHandler(async(req, res) => {
    const images = await Image.find();
    res.send(images);
}));

uploadRouter.delete('/:id', isAuth, expressAsyncHandler(async(req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const image = await Image.findById(product.fileId);
    if (image) {
        const deleteImage = await image.remove();
        res.send({ message: 'Image Deleted', image: deleteImage });
    } else {
        res.status(404).send({ message: 'Image Not Found' });
    }
}));

uploadRouter.get('/show/:id', expressAsyncHandler(async(req, res) => {

    const id = req.params.id;
    const product = await Product.findById({ _id: id });
    const images = await Image.find({ _id: product.fileId });
    // const images = await Image.find({ _id:id });
    var filename = images[0].filename;
    const conn = mongoose.connection;
    var gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    gfs.files.find({ filename: filename }).toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.status(404).json({
                err: "no files exist"
            });
        }
        var bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads',
        })
        var readstream = bucket.openDownloadStreamByName(filename);
        return readstream.pipe(res);
    });
}));


export default uploadRouter;