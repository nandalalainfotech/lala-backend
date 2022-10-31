import multer from 'multer';
import express from 'express';
import path from "path";
import { GridFsStorage } from "multer-gridfs-storage";
import crypto from "crypto";
const storage = new GridFsStorage({
    url: 'mongodb+srv://nandalala:Spartans!23@cluster0.ujwabrm.mongodb.net/laladb?retryWrites=true&w=majority',
    // url: 'mongodb+srv://nandalala:Spartans!23@cluster0.ujwabrm.mongodb.net/laladb?retryWrites=true&w=majority',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                };
                resolve(fileInfo);
            });
        });
    },
});
const upload = multer({ storage });
export default upload;













