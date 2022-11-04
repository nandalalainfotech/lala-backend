import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import RainJacket from '../Models/rainjacketModel.js';

const rainjacketRouter = express.Router();

rainjacketRouter.get(
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
        const count = await RainJacket.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const rainjackets = await RainJacket.find({
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
        res.send({ rainjackets, page, pages: Math.ceil(count / pageSize) });
    })
);


rainjacketRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await RainJacket.find().distinct('category');
        res.send(categories);
    })
);

rainjacketRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await RainJacket.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const rainjackets = data.rainjackets.map((rainjacket) => ({
                ...rainjacket,
                seller: seller._id,
            }));
            const createdRainJackets = await RainJacket.insertMany(rainjackets);
            res.send({ createdRainJackets });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

rainjacketRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const rainjacket = await RainJacket.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (rainjacket) {
            res.send(rainjacket);
        } else {
            res.status(404).send({ message: 'RainJacket Not Found' });
        }
    })
);

rainjacketRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const rainjacket = new RainJacket({
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
        const createdRainJacket = await RainJacket.save();
        res.send({ message: 'RainJacket Created', rainjacket: createdRainJacket });
    })
);
rainjacketRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const rainjacketId = req.params.id;
        const rainjacket = await RainJacket.findById(rainjacketId);
        if (rainjacket) {
            console.log('rainjacket');
            rainjacket.name = req.body.name;
            rainjacket.price = req.body.price;
            rainjacket.image = req.body.image;

            rainjacket.images = req.body.images;

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
            rainjacket.category = req.body.category;
            rainjacket.brand = req.body.brand;
            rainjacket.countInStock = req.body.countInStock;
            rainjacket.description = req.body.description;
            const updatedRainJacket = await RainJacket.save();
            res.send({ message: 'RainJacket Updated', rainjacket: updatedRainJacket });
        } else {
            res.status(404).send({ message: 'RainJacket Not Found' });
        }
    })
);
rainjacketRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const rainjacket = await RainJacket.findById(req.params.id);
        if (rainjacket) {
            const deleteRainJacket = await rainjacket.remove();
            res.send({ message: 'RainJacket Deleted', rainjacket: deleteRainJacket });
        } else {
            res.status(404).send({ message: 'RainJacket Not Found' });
        }
    })
);

rainjacketRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const rainjacketId = req.params.id;
        const rainjacket = await RainJacket.findById(rainjacketId);
        if (rainjacket) {
            if (rainjacket.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            rainjacket.reviews.push(review);
            rainjacket.numReviews = rainjacket.reviews.length;
            rainjacket.rating =
                rainjacket.reviews.reduce((a, c) => c.rating + a, 0) /
                rainjacket.reviews.length;
            const updatedRainJacket = await RainJacket.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedRainJacket.reviews[updatedRainJacket.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'RainJacket Not Found' });
        }
    })
);

export default rainjacketRouter;