import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Jacket from '../Models/jacketModel.js';

const jacketRouter = express.Router();

jacketRouter.get(
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
        const count = await Jacket.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const jackets = await Jacket.find({
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
        res.send({ jackets, page, pages: Math.ceil(count / pageSize) });
    })
);


jacketRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Jacket.find().distinct('category');
        res.send(categories);
    })
);

jacketRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Jacket.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const jackets = data.jackets.map((jacket) => ({
                ...cajacket,
                seller: seller._id,
            }));
            const createdJackets = await Jacket.insertMany(jackets);
            res.send({ createdJackets });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

jacketRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const jacket = await Jacket.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (jacket) {
            res.send(jacket);
        } else {
            res.status(404).send({ message: 'jacket Not Found' });
        }
    })
);

jacketRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const jacket = new Jacket({
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
        const createdJacket = await jacket.save();
        res.send({ message: 'Jacket Created', jacket: createdJacket });
    })
);
jacketRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const jacketId = req.params.id;
        const jacket = await Jacket.findById(jacketId);
        if (jacket) {
            console.log('jacket');
            jacket.name = req.body.name;
            jacket.price = req.body.price;
            jacket.image = req.body.image;

            jacket.images = req.body.images;

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
            jacket.category = req.body.category;
            jacket.brand = req.body.brand;
            jacket.countInStock = req.body.countInStock;
            jacket.description = req.body.description;
            const updatedJacket = await jacket.save();
            res.send({ message: 'jacket Updated', jacket: updatedJacket });
        } else {
            res.status(404).send({ message: 'Jacket Not Found' });
        }
    })
);
jacketRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const jacket = await Jacket.findById(req.params.id);
        if (jacket) {
            const deleteJacket = await jacket.remove();
            res.send({ message: 'jacket Deleted', jacket: deleteJacket });
        } else {
            res.status(404).send({ message: 'Jacket Not Found' });
        }
    })
);

jacketRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const jacketId = req.params.id;
        const jacket = await Jacket.findById(jacketId);
        if (jacket) {
            if (jacket.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            jacket.reviews.push(review);
            jacket.numReviews = jacket.reviews.length;
            jacket.rating =
            jacket.reviews.reduce((a, c) => c.rating + a, 0) /
            jacketreviews.length;
            const updatedJacket = await jacket.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedJacket.reviews[updatedJacket.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Jacket Not Found' });
        }
    })
);

export default jacketRouter;