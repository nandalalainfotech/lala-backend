import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Sweater from '../Models/sweaterModel.js';

const sweaterRouter = express.Router();

sweaterRouter.get(
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
        const count = await Sweater.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const sweaters = await Sweater.find({
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
        res.send({ sweaters, page, pages: Math.ceil(count / pageSize) });
    })
);


sweaterRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Sweater.find().distinct('category');
        res.send(categories);
    })
);

sweaterRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Sweater.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const sweaters = data.sweaters.map((sweater) => ({
                ...sweater,
                seller: seller._id,
            }));
            const createdSweaters = await Sweater.insertMany(sweaters);
            res.send({ createdSweaters });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

sweaterRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const sweater = await Sweater.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (sweater) {
            res.send(sweater);
        } else {
            res.status(404).send({ message: 'sweater Not Found' });
        }
    })
);

sweaterRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const sweater = new Sweater({
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
        const createdSweater = await sweater.save();
        res.send({ message: 'Sweater Created', sweater: createdSweater });
    })
);
sweaterRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const sweaterId = req.params.id;
        const sweater = await Sweater.findById(sweaterId);
        if (sweater) {
            console.log('sweater');
            sweater.name = req.body.name;
            sweater.price = req.body.price;
            sweater.image = req.body.image;

            sweater.images = req.body.images;

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
            sweater.category = req.body.category;
            sweater.brand = req.body.brand;
            sweater.countInStock = req.body.countInStock;
            sweater.description = req.body.description;
            const updatedSweater = await sweater.save();
            res.send({ message: 'Sweater Updated', sweater: updatedSweater });
        } else {
            res.status(404).send({ message: 'Sweater Not Found' });
        }
    })
);
sweaterRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const sweater = await Sweater.findById(req.params.id);
        if (sweater) {
            const deleteSweater = await sweater.remove();
            res.send({ message: 'Sweater Deleted', sweater: deleteSweater });
        } else {
            res.status(404).send({ message: 'Sweater Not Found' });
        }
    })
);

sweaterRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const sweaterId = req.params.id;
        const sweater = await Sweater.findById(sweaterId);
        if (sweater) {
            if (sweater.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            sweater.reviews.push(review);
            sweater.numReviews = sweater.reviews.length;
            sweater.rating =
            sweater.reviews.reduce((a, c) => c.rating + a, 0) /
            sweater.reviews.length;
            const updatedSweater = await sweater.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedSweater.reviews[updatedSweater.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Sweater Not Found' });
        }
    })
);

export default sweaterRouter;