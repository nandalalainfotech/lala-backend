import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Casualshirt from '../Models/casualshirtModel.js';

const casualshirtRouter = express.Router();

casualshirtRouter.get(
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
        const count = await Casualshirt.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const casualshirts = await Casualshirt.find({
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
        res.send({ casualshirts, page, pages: Math.ceil(count / pageSize) });
    })
);


casualshirtRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Casualshirt.find().distinct('category');
        res.send(categories);
    })
);

casualshirtRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Casualshirt.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const casualshirts = data.casualshirts.map((casualshirt) => ({
                ...casualshirt,
                seller: seller._id,
            }));
            const createdCasualshirts = await Casualshirt.insertMany(casualshirts);
            res.send({ createdCasualshirts });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

casualshirtRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const casualshirt = await Casualshirt.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (casualshirt) {
            res.send(casualshirt);
        } else {
            res.status(404).send({ message: 'casualshirt Not Found' });
        }
    })
);

casualshirtRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const casualshirt = new Casualshirt({
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
        const createdCasualshirt = await casualshirt.save();
        res.send({ message: 'Casualshirt Created', casualshirt: createdCasualshirt });
    })
);
casualshirtRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const casualshirtId = req.params.id;
        const casualshirt = await Casualshirt.findById(casualshirtId);
        if (casualshirt) {
            console.log('casualshirt');
            casualshirt.name = req.body.name;
            casualshirt.price = req.body.price;
            casualshirt.image = req.body.image;

            casualshirt.images = req.body.images;

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
            casualshirt.category = req.body.category;
            casualshirt.brand = req.body.brand;
            casualshirt.countInStock = req.body.countInStock;
            casualshirt.description = req.body.description;
            const updatedCasualshirt = await casualshirt.save();
            res.send({ message: 'Casualshirt Updated', casualshirt: updatedCasualshirt });
        } else {
            res.status(404).send({ message: 'Casualshirt Not Found' });
        }
    })
);
casualshirtRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const casualshirt = await Casualshirt.findById(req.params.id);
        if (casualshirt) {
            const deleteCasualshirt = await casualshirt.remove();
            res.send({ message: 'Casualshirt Deleted', casualshirt: deleteCasualshirt });
        } else {
            res.status(404).send({ message: 'Casualshirt Not Found' });
        }
    })
);

casualshirtRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const casualshirtId = req.params.id;
        const casualshirt = await Casualshirt.findById(casualshirtId);
        if (casualshirt) {
            if (casualshirt.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            casualshirt.reviews.push(review);
            casualshirt.numReviews = casualshirt.reviews.length;
            casualshirt.rating =
                casualshirt.reviews.reduce((a, c) => c.rating + a, 0) /
                casualshirt.reviews.length;
            const updatedCasualshirt = await casualshirt.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedCasualshirt.reviews[updatedCasualshirt.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Casualshirt Not Found' });
        }
    })
);

export default casualshirtRouter;