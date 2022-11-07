import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Nehru from '../Models/nehruModel.js';

const nehruRouter = express.Router();

nehruRouter.get(
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
        const count = await Nehru.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const nehrus = await Nehru.find({
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
        res.send({ nehrus, page, pages: Math.ceil(count / pageSize) });
    })
);


nehruRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Nehru.find().distinct('category');
        res.send(categories);
    })
);

nehruRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await nehru.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const nehrus = data.nehrus.map((nehru) => ({
                ...nehru,
                seller: seller._id,
            }));
            const createdNehrus = await Nehru.insertMany(nehrus);
            res.send({ createdNehrus });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

nehruRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const nehru = await Nehru.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (nehru) {
            res.send(nehru);
        } else {
            res.status(404).send({ message: 'Nehru Not Found' });
        }
    })
);

nehruRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const nehru = new Nehru({
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
        const createdNehru = await nehru.save();
        res.send({ message: 'Nehru Created', nehru: createdNehru });
    })
);
nehruRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const nehruId = req.params.id;
        const nehru = await Nehru.findById(nehruId);
        if (nehru) {
            console.log('nehru');
            nehru.name = req.body.name;
            nehru.price = req.body.price;
            nehru.image = req.body.image;

            nehru.images = req.body.images;

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
            nehru.category = req.body.category;
            nehru.brand = req.body.brand;
            nehru.countInStock = req.body.countInStock;
            nehru.description = req.body.description;
            const updatedNehru = await nehru.save();
            res.send({ message: 'Nehru Updated', nehru: updatedNehru });
        } else {
            res.status(404).send({ message: 'Nehru Not Found' });
        }
    })
);
nehruRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const nehru = await Nehru.findById(req.params.id);
        if (nehru) {
            const deleteNehru = await nehru.remove();
            res.send({ message: 'Nehru Deleted', nehru:deleteNehru });
        } else {
            res.status(404).send({ message: 'Nehru Not Found' });
        }
    })
);

nehruRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const nehruId = req.params.id;
        const nehru = await Nehru.findById(nehruId);
        if (nehru) {
            if (nehru.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            nehru.reviews.push(review);
            nehru.numReviews = nehru.reviews.length;
            nehru.rating =
            nehru.reviews.reduce((a, c) => c.rating + a, 0) /
            nehru.reviews.length;
            const updatedNehru = await nehru.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedNehru.reviews[updatedNehru.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Nehru Not Found' });
        }
    })
);

export default nehruRouter;