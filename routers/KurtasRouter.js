import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Kurtas from '../Models/kurtasModel.js';

const kurtasRouter = express.Router();

kurtasRouter.get(
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
        const count = await Kurtas.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const kurtass = await Kurtas.find({
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
        res.send({ kurtass, page, pages: Math.ceil(count / pageSize) });
    })
);


kurtasRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Kurtas.find().distinct('category');
        res.send(categories);
    })
);

kurtasRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Kurtas.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const kurtass = data.kurtass.map((kurtas) => ({
                ...kurtas,
                seller: seller._id,
            }));
            const createdKurtass = await Kurtas.insertMany(kurtass);
            res.send({ createdKurtass });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

kurtasRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const kurtas = await Kurtas.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (kurtas) {
            res.send(kurtas);
        } else {
            res.status(404).send({ message: 'Kurtas Not Found' });
        }
    })
);

kurtasRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const kurtas = new Kurtas({
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
        const createdKurtas = await kurtas.save();
        res.send({ message: 'Kurtas Created', kurtas: createdKurtas });
    })
);
kurtasRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const kurtasId = req.params.id;
        const kurtas = await Kurtas.findById(kurtasId);
        if (kurtas) {
            console.log('kurtas');
            kurtas.name = req.body.name;
            kurtas.price = req.body.price;
            kurtas.image = req.body.image;

            kurtas.images = req.body.images;

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
            kurtas.category = req.body.category;
            kurtas.brand = req.body.brand;
            kurtas.countInStock = req.body.countInStock;
            kurtas.description = req.body.description;
            const updatedKurtas = await kurtas.save();
            res.send({ message: 'Kurtas Updated', kurtas: updatedKurtas });
        } else {
            res.status(404).send({ message: 'Kurtas Not Found' });
        }
    })
);
kurtasRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const kurtas = await Kurtas.findById(req.params.id);
        if (kurtast) {
            const deleteKurtas = await kurtas.remove();
            res.send({ message: 'Kurtas Deleted', kurtas: deleteKurtas });
        } else {
            res.status(404).send({ message: 'Kurtas Not Found' });
        }
    })
);

kurtasRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const kurtasId = req.params.id;
        const kurtas = await Kurtas.findById(kurtasId);
        if (kurtas) {
            if (kurtas.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            kurtas.reviews.push(review);
            kurtas.numReviews = kurtas.reviews.length;
            kurtas.rating =
            kurtas.reviews.reduce((a, c) => c.rating + a, 0) /
            kurtas.reviews.length;
            const updatedKurtas = await kurtas.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedKurtas.reviews[updatedKurtas.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Kurtas Not Found' });
        }
    })
);

export default kurtasRouter;