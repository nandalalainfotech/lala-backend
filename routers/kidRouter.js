import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';
import Kid from '../Models/kidModel.js';
import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';

const kidRouter = express.Router();

kidRouter.get(
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
    const categoryFilter = category ? { category} : {};
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
    const count = await Kid.count({
      ...sellerFilter,
      ...nameFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    // const kids = await Kid.find({ ...sellerFilter });
    const kids = await Kid.find({
      ...sellerFilter,
      ...nameFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .populate('seller', 'seller.name seller.logo')
      //     .sort(sortOrder);
      //   res.send(kids);
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.send({ kids, page, pages: Math.ceil(count / pageSize) });
  })
);


kidRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Kid.find().distinct('category');
    res.send(categories);
  })
);

kidRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    await Kid.remove({});
    // const createdKids = await Kid.insertMany(data.kids);
    // res.send({ createdKids });
    const seller = await User.findOne({ isSeller: true });
    if (seller) {
      const kids = data.kids.map((kid) => ({
        ...kid,
        seller: seller._id,
      }));
      const createdKids = await Kid.insertMany(kids);
      res.send({ createdKids });
    } else {
      res
        .status(500)
        .send({ message: 'No seller found. first run /api/users/seed' });
    }
  })
);

kidRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    // const kid = await Kid.findById(req.params.id);
    const kid = await Kid.findById(req.params.id).populate(
      'seller',
      'seller.name seller.logo seller.rating seller.numReviews'
    );
    if (kid) {
      res.send(kid);
    } else {
      res.status(404).send({ message: 'Kid Not Found' });
    }
  })
);

kidRouter.post(
  '/',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const kid = new Kid({
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
    const createdKid = await kid.save();
    res.send({ message: 'Kid Created', kid: createdKid });
  })
);
kidRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const kidId = req.params.id;
    const kid = await Kid.findById(kidId);
    if (kid) {
      kid.name = req.body.name;
      kid.price = req.body.price;
      kid.image = req.body.image;
      kid.images = req.body.images;
      kid.category = req.body.category;
      kid.brand = req.body.brand;
      kid.countInStock = req.body.countInStock;
      kid.description = req.body.description;
      const updatedKid = await kid.save();
      res.send({ message: 'Kid Updated', kid: updatedKid });
    } else {
      res.status(404).send({ message: 'Kid Not Found' });
    }
  })
);
kidRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const kid = await Kid.findById(req.params.id);
    if (kid) {
      const deleteKid = await kid.remove();
      res.send({ message: 'Kid Deleted', kid: deleteKid });
    } else {
      res.status(404).send({ message: 'Kid Not Found' });
    }
  })
);

kidRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const kidId = req.params.id;
    const kid = await Kid.findById(kidId);
    if (kid) {
      if (kid.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      kid.reviews.push(review);
      kid.numReviews = kid.reviews.length;
      kid.rating =
        kid.reviews.reduce((a, c) => c.rating + a, 0) /
        kid.reviews.length;
      const updatedKid = await kid.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedKid.reviews[updatedKid.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'Kid Not Found' });
    }
  })
);

export default kidRouter;