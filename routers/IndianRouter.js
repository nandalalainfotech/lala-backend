import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Indian from '../Models/indianModel.js';

const indianRouter = express.Router();

indianRouter.get(
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
        const count = await Indian.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const indians = await Indian.find({
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
        res.send({ indians, page, pages: Math.ceil(count / pageSize) });
    })
);


indianRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Indian.find().distinct('category');
        res.send(categories);
    })
);

indianRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Indian.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const indians = data.indians.map((indian) => ({
                ...indian,
                seller: seller._id,
            }));
            const createdIndians = await Indian.insertMany(indians);
            res.send({ createdIndians });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

indianRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const indian = await Indian.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (indian) {
            res.send(indian);
        } else {
            res.status(404).send({ message: 'indian Not Found' });
        }
    })
);

indianRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const indian = new Indian({
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
        const createdIndian = await indian.save();
        res.send({ message: 'Indian Created', indian: createdIndian });
    })
);
indianRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const indianId = req.params.id;
        const indian = await Indian.findById(indianId);
        if (indian) {
            console.log('indian');
            indian.name = req.body.name;
            indian.price = req.body.price;
            indian.image = req.body.image;

            indian.images = req.body.images;

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
            indian.category = req.body.category;
            indian.brand = req.body.brand;
            indian.countInStock = req.body.countInStock;
            indian.description = req.body.description;
            const updatedIndian = await indian.save();
            res.send({ message: 'Indian Updated', indian: updatedIndian });
        } else {
            res.status(404).send({ message: 'Indian Not Found' });
        }
    })
);
indianRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const indian = await Indian.findById(req.params.id);
        if (indian) {
            const deleteIndian = await indian.remove();
            res.send({ message: 'Indian Deleted', indian: deleteIndian });
        } else {
            res.status(404).send({ message: 'Indian Not Found' });
        }
    })
);

indianRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const indianId = req.params.id;
        const indian = await Indian.findById(indianId);
        if (indian) {
            if (indian.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            indian.reviews.push(review);
            indian.numReviews = indian.reviews.length;
            indian.rating =
            indian.reviews.reduce((a, c) => c.rating + a, 0) /
            indian.reviews.length;
            const updatedIndian = await indian.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedIndian.reviews[updatedIndian.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Indian Not Found' });
        }
    })
);

export default indianRouter;