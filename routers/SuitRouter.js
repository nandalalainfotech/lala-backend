import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';
import Suit from '../Models/suitModel.js';
import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';

const suitRouter = express.Router();

suitRouter.get(
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
    const count = await Suit .count({
      ...sellerFilter,
      ...nameFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    // const kids = await Kid.find({ ...sellerFilter });
    const suits = await Suit.find({
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
    res.send({ suits, page, pages: Math.ceil(count / pageSize) });
  })
);


suitRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Suit.find().distinct('category');
    res.send(categories);
  })
);

suitRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    await Suit.remove({});
    // const createdKids = await Kid.insertMany(data.kids);
    // res.send({ createdKids });
    const seller = await User.findOne({ isSeller: true });
    if (seller) {
      const suits = data.suits.map((suit) => ({
        ...suit,
        seller: seller._id,
      }));
      const createdSuits = await Suit.insertMany(suits);
      res.send({ createdSuits });
    } else {
      res
        .status(500)
        .send({ message: 'No seller found. first run /api/users/seed' });
    }
  })
);

suitRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    // const kid = await Kid.findById(req.params.id);
    const suit = await Suit.findById(req.params.id).populate(
      'seller',
      'seller.name seller.logo seller.rating seller.numReviews'
    );
    if (suit) {
      res.send(suit);
    } else {
      res.status(404).send({ message: 'Suit Not Found' });
    }
  })
);

suitRouter.post(
  '/',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const suit = new Suit({
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
    const createdSuit = await suit.save();
    res.send({ message: 'Suit Created', suit: createdSuit });
  })
);
suitRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const suitId = req.params.id;
    const suit = await Suit.findById(suitId);
    if (suit) {
        suit.name = req.body.name;
        suit.price = req.body.price;
        suit.image = req.body.image;
        suit.images = req.body.images;
        suit.category = req.body.category;
        suit.brand = req.body.brand;
        suit.countInStock = req.body.countInStock;
        suit.description = req.body.description;
      const updatedSuit = await suit.save();
      res.send({ message: 'Suit Updated',suit: updatedSuit });
    } else {
      res.status(404).send({ message: 'Suit Not Found' });
    }
  })
);
suitRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const suit = await Suit.findById(req.params.id);
    if (suit) {
      const deleteSuit = await suit.remove();
      res.send({ message: 'Suit Deleted', suit: deleteSuit });
    } else {
      res.status(404).send({ message: 'Suit Not Found' });
    }
  })
);

suitRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const suitId = req.params.id;
    const suit = await Suit.findById(suitId);
    if (suit) {
      if (suit.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      suit.reviews.push(review);
      suit.numReviews = suit.reviews.length;
      suit.rating =
      suit.reviews.reduce((a, c) => c.rating + a, 0) /
      suit.reviews.length;
      const updatedSuit = await suit.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedSuit.reviews[updatedSuit.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'Suit Not Found' });
    }
  })
);

export default suitRouter;