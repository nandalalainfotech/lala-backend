import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Tshirt from '../Models/tshirtModel.js';

const tshirtRouter = express.Router();

tshirtRouter.get(
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
        const count = await Tshirt.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const tshirts = await Tshirt.find({
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
        res.send({ tshirts, page, pages: Math.ceil(count / pageSize) });
    })
);


tshirtRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Tshirt.find().distinct('category');
        res.send(categories);
    })
);

tshirtRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Tshirt.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const tshirts = data.tshirts.map((tshirt) => ({
                ...tshirt,
                seller: seller._id,
            }));
            const createdTshirts = await Tshirt.insertMany(tshirts);
            res.send({ createdTshirts });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

tshirtRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const tshirt = await Tshirt.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (tshirt) {
            res.send(tshirt);
        } else {
            res.status(404).send({ message: 'tshirt Not Found' });
        }
    })
);

tshirtRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const tshirt = new Tshirt({
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
        const createdTshirt = await tshirt.save();
        res.send({ message: 'Tshirt Created', tshirt: createdTshirt });
    })
);
tshirtRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const tshirtId = req.params.id;
        const tshirt = await Tshirt.findById(tshirtId);
        if (tshirt) {
            console.log('tshirt');
            tshirt.name = req.body.name;
            tshirt.price = req.body.price;
            tshirt.image = req.body.image;

            tshirt.images = req.body.images;

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
            tshirt.category = req.body.category;
            tshirt.brand = req.body.brand;
            tshirt.countInStock = req.body.countInStock;
            tshirt.description = req.body.description;
            const updatedTshirt = await tshirt.save();
            res.send({ message: 'Tshirt Updated', tshirt: updatedTshirt });
        } else {
            res.status(404).send({ message: 'Tshirt Not Found' });
        }
    })
);
tshirtRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const tshirt = await Tshirt.findById(req.params.id);
        if (tshirtt) {
            const deleteTshirt = await tshirt.remove();
            res.send({ message: 'Tshirt Deleted', tshirt: deleteTshirt });
        } else {
            res.status(404).send({ message: 'Tshirt Not Found' });
        }
    })
);

tshirtRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const tshirtId = req.params.id;
        const tshirt = await Tshirt.findById(tshirtId);
        if (tshirtt) {
            if (tshirt.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            tshirt.reviews.push(review);
            tshirt.numReviews = tshirt.reviews.length;
            tshirt.rating =
                tshirt.reviews.reduce((a, c) => c.rating + a, 0) /
                tshirt.reviews.length;
            const updatedTshirt = await tshirt.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedTshirt.reviews[updatedTshirtroduct.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Tshirt Not Found' });
        }
    })
);

export default tshirtRouter;