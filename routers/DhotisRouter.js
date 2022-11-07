import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Dhotis from '../Models/dhotisModel.js';

const dhotisRouter = express.Router();

dhotisRouter.get(
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
        const count = await Dhotis.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const dhotiss = await Dhotis.find({
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
        res.send({ dhotiss, page, pages: Math.ceil(count / pageSize) });
    })
);


dhotisRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Dhotis.find().distinct('category');
        res.send(categories);
    })
);

dhotisRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Dhotis.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const dhotiss = data.dhotiss.map((dhotis) => ({
                ...dhotis,
                seller: seller._id,
            }));
            const createdDhotiss = await Dhotis.insertMany(dhotiss);
            res.send({ createdDhotiss });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

dhotisRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const dhotis = await Dhotis.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (dhotis) {
            res.send(dhotis);
        } else {
            res.status(404).send({ message: 'Dhotis Not Found' });
        }
    })
);

dhotisRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const dhotis = new Dhotis({
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
        const createdDhotis = await dhotis.save();
        res.send({ message: 'Dhotis Created', dhotis: createddhotis });
    })
);
dhotisRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const dhotisId = req.params.id;
        const dhotis = await Dhotis.findById(dhotisId);
        if (dhotis) {
            console.log('dhotis');
            dhotis.name = req.body.name;
            dhotis.price = req.body.price;
            dhotis.image = req.body.image;

            dhotis.images = req.body.images;

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
            dhotis.category = req.body.category;
            dhotis.brand = req.body.brand;
            dhotis.countInStock = req.body.countInStock;
            dhotis.description = req.body.description;
            const updatedDhotis = await dhotis.save();
            res.send({ message: 'Dhotis Updated', dhotis: updatedDhotis });
        } else {
            res.status(404).send({ message: 'Dhotis Not Found' });
        }
    })
);
dhotisRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const dhotis = await Dhotis.findById(req.params.id);
        if (dhotis) {
            const deleteDhotis = await dhotis.remove();
            res.send({ message: 'Dhotis Deleted', dhotis: deleteDhotis });
        } else {
            res.status(404).send({ message: 'Dhotis Not Found' });
        }
    })
);

dhotisRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const dhotisId = req.params.id;
        const dhotis = await Dhotis.findById(dhotisId);
        if (dhotis) {
            if (dhotis.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            dhotis.reviews.push(review);
            dhotis.numReviews = dhotis.reviews.length;
            dhotis.rating =
            dhotis.reviews.reduce((a, c) => c.rating + a, 0) /
            dhotis.reviews.length;
            const updatedDhotis = await dhotis.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedDhotis.reviews[updatedDhotis.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Dhotis Not Found' });
        }
    })
);

export default dhotisRouter;