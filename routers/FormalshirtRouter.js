import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';

import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';
import Formalshirt from '../Models/formalshirtModel.js';

const formalshirtRouter = express.Router();

formalshirtRouter.get(
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
        const count = await Formalshirt.count({
            ...sellerFilter,
            ...nameFilter,
            ...categoryFilter,
            ...priceFilter,
            ...ratingFilter,
        });
        // const products = await Product.find({ ...sellerFilter });
        const formalshirts = await Formalshirt.find({
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
        res.send({ formalshirts, page, pages: Math.ceil(count / pageSize) });
    })
);


formalshirtRouter.get(
    '/categories',
    expressAsyncHandler(async (req, res) => {
        const categories = await Formalshirt.find().distinct('category');
        res.send(categories);
    })
);

formalshirtRouter.get(
    '/seed',
    expressAsyncHandler(async (req, res) => {
        await Formalshirt.remove({});
        // const createdProducts = await Product.insertMany(data.products);
        // res.send({ createdProducts });
        const seller = await User.findOne({ isSeller: true });
        if (seller) {
            const formalshirts = data.formalshirts.map((formalshirt) => ({
                ...formalshirt,
                seller: seller._id,
            }));
            const createdFormalshirts = await Formalshirt.insertMany(formalshirts);
            res.send({ createdFormalshirts });
        } else {
            res
                .status(500)
                .send({ message: 'No seller found. first run /api/users/seed' });
        }
    })
);

formalshirtRouter.get(
    '/:id',
    expressAsyncHandler(async (req, res) => {
        // const product = await Product.findById(req.params.id);
        const formalshirt = await Formalshirt.findById(req.params.id).populate(
            'seller',
            'seller.name seller.logo seller.rating seller.numReviews'
        );
        if (formalshirt) {
            res.send(formalshirt);
        } else {
            res.status(404).send({ message: 'formalshirt Not Found' });
        }
    })
);

formalshirtRouter.post(
    '/',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const formalshirt = new Formalshirt({
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
        const createdFormalshirt = await formalshirt.save();
        res.send({ message: 'Formalshirt Created', formalshirt: createdFormalshirt });
    })
);
formalshirtRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    isSellerOrAdmin,
    expressAsyncHandler(async (req, res) => {
        const formalshirtId = req.params.id;
        const formalshirt = await Formalshirt.findById(formalshirtId);
        if (formalshirt) {
            console.log('formalshirt');
            formalshirt.name = req.body.name;
            formalshirt.price = req.body.price;
            formalshirt.image = req.body.image;

            formalshirt.images = req.body.images;

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
            formalshirt.category = req.body.category;
            formalshirt.brand = req.body.brand;
            formalshirt.countInStock = req.body.countInStock;
            formalshirt.description = req.body.description;
            const updatedFormalshirt = await formalshirt.save();
            res.send({ message: 'Formalshirt Updated', formalshirt: updatedFormalshirt });
        } else {
            res.status(404).send({ message: 'Formalshirt Not Found' });
        }
    })
);
formalshirtRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const formalshirt = await Formalshirt.findById(req.params.id);
        if (formalshirtt) {
            const deleteFormalshirt = await formalshirt.remove();
            res.send({ message: 'Formalshirt Deleted', formalshirt: deleteFormalshirt });
        } else {
            res.status(404).send({ message: 'Formalshirt Not Found' });
        }
    })
);

formalshirtRouter.post(
    '/:id/reviews',
    isAuth,
    expressAsyncHandler(async (req, res) => {
        const formalshirtId = req.params.id;
        const formalshirt = await Formalshirt.findById(formalshirtId);
        if (formalshirt) {
            if (formalshirt.reviews.find((x) => x.name === req.user.name)) {
                return res
                    .status(400)
                    .send({ message: 'You already submitted a review' });
            }
            const review = {
                name: req.user.name,
                rating: Number(req.body.rating),
                comment: req.body.comment,
            };
            formalshirt.reviews.push(review);
            formalshirt.numReviews = formalshirt.reviews.length;
            formalshirt.rating =
            formalshirt.reviews.reduce((a, c) => c.rating + a, 0) /
            formalshirt.reviews.length;
            const updatedFormalshirt = await formalshirt.save();
            res.status(201).send({
                message: 'Review Created',
                review: updatedFormalshirt.reviews[updatedFormalshirt.reviews.length - 1],
            });
        } else {
            res.status(404).send({ message: 'Formalshirt Not Found' });
        }
    })
);

export default formalshirtRouter;