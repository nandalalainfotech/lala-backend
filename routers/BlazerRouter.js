import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Blazer from '../Models/blazerModel.js';

const blazerRouter = express.Router();

blazerRouter.get(
    '/',
    expressAsyncHandler(async (req, res) => {
        const pageSize = 5;
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
        const count = await Blazer.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const blazers = await Blazer.find({
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
        res.send({ blazers, page, pages: Math.ceil(count / pageSize) });
    })
);


blazerRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Blazer.find().distinct('category');
        res.send(categories);
    })
);

blazerRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Blazer.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const blazers = data.blazers.map((blazer) => ({
                ...blazer,
                seller: seller._id,
            }));
            const createdBlazers = await Blazer.insertMany(blazers);
            res.send({ createdBlazers });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

blazerRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const blazer = await Blazer.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (blazer) {
            res.send(blazer);
        } else {
            res.status(404).send({ message: 'Blazer Not Found' });
        }
    })
);

blazerRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const blazer = new Blazer({
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
        const createdBlazer = await Blazer.save();
        res.send({ message: 'Blazer Created', blazer: createdBlazer });
    })
);
blazerRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const blazerId = req.params.id;
        const blazer = await Blazer.findById(blazerId);
        if (blazer) {
            console.log('blazer');
            blazer.name = req.body.name;
            blazer.price = req.body.price;
            blazer.image = req.body.image;

            blazer.images = req.body.images;

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
            blazer.category = req.body.category;
            blazer.brand = req.body.brand;
            blazer.countInStock = req.body.countInStock;
            blazer.description = req.body.description;
            const updatedBlazer = await Blazer.save();
            res.send({ message: 'Blazer Updated', blazer: updatedBlazer});
        } else {
            res.status(404).send({ message: 'Blazer Not Found' });
        }
    })
);
blazerRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const blazer = await Blazer.findById(req.params.id);
        if (blazer) {
            const deleteBlazer = await blazer.remove();
            res.send({ message: 'Blazer Deleted', blazer: deleteBlazer });
        } else {
            res.status(404).send({ message: 'Blazer Not Found' });
        }
    })
);

blazerRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const blazerId = req.params.id;
        const blazer = awaitBlazer.findById(blazerId);
        if (blazer) {
            if (blazer.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            blazer.reviews.push(review);
            blazer.numReviews = blazer.reviews.length;
            blazer.rating =
                blazer.reviews.reduce((a, c) => c.rating + a, 0) /
                blazer.reviews.length;
            const updatedBlazer = await blazer.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedBlazer.reviews[updatedBlazer.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Blazer Not Found' });
        }
    })
);

export default blazerRouter;