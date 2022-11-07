import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Sherwani from '../Models/sherwaniModel.js';

const sherwaniRouter = express.Router();

sherwaniRouter.get(
    '/',
    expressAsyncHandler(async (req, res) => {
        const pageSize = 4;
        const page = Number(req.query.pageNumber) || 1;
        const name = req.query.name || '';
        const seller = req.query.seller || '';
        const category = req.query.category || '';
        const order = req.query.order || '';
        const min =
            req.query.min && Number(req.query.min) !== 0 ? Number(req.query.min) : 0;
        const max =
            req.query.max && Number(req.query.max) !== 0 ? Number(req.query.max) : 0;
        const rating =
            req.query.rating && Number(req.query.rating) !== 0
                ? Number(req.query.rating)
                : 0;

        const nameFilter = name ? { name: { $regex: name, $options: 'i' } } : {};
        const sellerFilter = seller ? { seller } : {};
        const categoryFilter = category ? { category } : {};
        const priceFilter = min && max ? { price: { $gte: min, $lte: max } } : {};
        const ratingFilter = rating ? { rating: { $gte: rating } } : {};
        const sortOrder =
            order === 'lowest'
                ? { price: 1 }
                : order === 'highest'
                    ? { price: -1 }
                    : order === 'toprated'
                        ? { rating: -1 }
                        : { _id: -1 };
        const count = await Sherwani.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const sherwanis = await Sherwani.find({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        })
            .populate('seller', 'seller.name seller.logo')
            //     .sort(sortOrder);
            //   res.send(products);
            .sort(sortOrder)
            .skip(pageSize * (page - 1))
            .limit(pageSize);
        res.send({ sherwanis, page, pages: Math.ceil(count / pageSize) });
    })
);


sherwaniRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Sherwani.find().distinct('category');
        res.send(categories);
    })
);

sherwaniRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Sherwani.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const sherwanis = data.sherwanis.map((sherwani) => ({
                ...sherwani,
                seller: seller._id,
            }));
            const createdSherwanis = await Sherwani.insertMany(sherwanis);
            res.send({ createdSherwanis });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

sherwaniRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const sherwani = await Sherwani.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (sherwani) {
            res.send(sherwani);
        } else {
            res.status(404).send({ message: 'Sherwani Not Found' });
        }
    })
);

sherwaniRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const sherwani = new Sherwani({
            name: 'sample name ' + Date.now(),
            seller: req.user._id,
            image: '/image/p1.jpg',
            price: 0,
            category: 'sample category',
            brand: 'sample brand',
            countInStock: 0,
            rating: 0,
            numReviews: 0,
            description: 'sample description',
        });
        const createdSherwani = await sherwani.save();
        res.send({ message: 'Sherwani Created', sherwani: createdSherwani });
    })
);
sherwaniRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const sherwaniId = req.params.id;
        const sherwani = await Sherwani.findById(sherwaniId);
        if (sherwani) {
            console.log('sherwani');
            sherwani.name = req.body.name;
            sherwani.price = req.body.price;
            sherwani.image = req.body.image;

            sherwani.images = req.body.images;

            //   if (req.body.image.image) {
            //     product.fileId = req.body.image.image._id;
            //     product.image = req.body.image.image.path;
            //   } else if (req.body.image.audio) {
            //     product.fileId = req.body.image.audio._id;
            //     product.audio = req.body.image.audio.path;
            //   } else if (req.body.image.video) {
            //     product.fileId = req.body.image.video._id;
            //     product.video = req.body.image.video.path;
            //   }
            sherwani.category = req.body.category;
            sherwani.brand = req.body.brand;
            sherwani.countInStock = req.body.countInStock;
            sherwani.description = req.body.description;
            const updatedSherwani = await sherwani.save();
            res.send({ message: 'Sherwani Updated', sherwani: updatedSherwani });
        } else {
            res.status(404).send({ message: 'Sherwani Not Found' });
        }
    })
);
sherwaniRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const sherwani = await Sherwani.findById(req.params.id);
        if (sherwani) {
            const deleteSherwani = await sherwani.remove();
            res.send({ message: 'Sherwani Deleted', sherwani: deleteSherwani });
        } else {
            res.status(404).send({ message: 'Sherwani Not Found' });
        }
    })
);

sherwaniRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const sherwaniId = req.params.id;
        const sherwani = await Sherwani.findById(sherwaniId);
        if (sherwani) {
            if (sherwani.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            sherwani.reviews.push(review);
            sherwani.numReviews = sherwani.reviews.length;
            sherwani.rating =
            sherwani.reviews.reduce((a, c) => c.rating + a, 0) /
            sherwani.reviews.length;
            const updatedSherwani = await sherwani.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedSherwani.reviews[updatedSherwani.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Sherwani Not Found' });
        }
    })
);

export default sherwaniRouter;