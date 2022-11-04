import multer from 'multer';
import path from "path";
import { GridFsStorage } from "multer-gridfs-storage";
import crypto from "crypto";

const storage = new GridFsStorage({
    // url: 'mongodb://localhost/amazona',
    url: 'mongodb+srv://nandalala:Spartans!23@cluster0.ujwabrm.mongodb.net/laladb?retryWrites=true&w=majority',

    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname)

                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                };
                return resolve(fileInfo);
            });

        });

    },

});

// const local = multer.diskStorage({
//     destination(req, file, cb) {

//         const extension = file.originalname.split('.')[1]
//         // if (extension == 'jpg' || extension == 'png' || extension == 'GIF') {
//             cb(null, 'uploads/images/');
//         // }
//         // if (extension == 'mp3') {
//         //     cb(null, 'uploads/audios/');
//         // }
//         // if (extension == 'mp4') {
//         //     cb(null, 'uploads/videos/');
//         // }
//     },
//     filename(req, file, cb) {
//         cb(null, `${file.originalname}`);
//     },
// });

const upload = multer({ storage });

export default upload;