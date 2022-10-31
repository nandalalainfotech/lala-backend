import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';
import Women from '../Models/womenModel.js';
import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';

const womenRouter = express.Router();

womenRouter.get(
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
    const count = await Women.count({
      ...sellerFilter,
      ...nameFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    // const womens = await Women.find({ ...sellerFilter });
    const womens = await Women.find({
      ...sellerFilter,
      ...nameFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .populate('seller', 'seller.name seller.logo')
      //     .sort(sortOrder);
      //   res.send(womens);
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.send({ womens, page, pages: Math.ceil(count / pageSize) });
  })
);


womenRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Women.find().distinct('category');
    res.send(categories);
  })
);

womenRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    await Women.remove({});
    // const createdWomens = await Women.insertMany(data.womens);
    // res.send({ createdWomens });
    const seller = await User.findOne({ isSeller: true });
    if (seller) {
      const womens = data.womens.map((women) => ({
        ...women,
        seller: seller._id,
      }));
      const createdWomens = await Women.insertMany(womens);
      res.send({ createdWomens });
    } else {
      res
        .status(500)
        .send({ message: 'No seller found. first run /api/users/seed' });
    }
  })
);

womenRouter.get(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    // const women = await Women.findById(req.params.id);
    const women = await Women.findById(req.params.id).populate(
      'seller',
      'seller.name seller.logo seller.rating seller.numReviews'
    );
    if (women) {
      res.send(women);
    } else {
      res.status(404).send({ message: 'Women Not Found' });
    }
  })
);

womenRouter.post(
  '/',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const women = new Women({
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
    const createdWomen = await women.save();
    res.send({ message: 'Women Created', women: createdWomen });
  })
);
womenRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const womenId = req.params.id;
    const women = await Women.findById(womenId);
    if (women) {
      women.name = req.body.name;
      women.price = req.body.price;
      women.image = req.body.image;
      women.images = req.body.images;
      women.category = req.body.category;
      women.brand = req.body.brand;
      women.countInStock = req.body.countInStock;
      women.description = req.body.description;
      const updatedWomen = await women.save();
      res.send({ message: 'Women Updated', women: updatedWomen });
    } else {
      res.status(404).send({ message: 'Women Not Found' });
    }
  })
);
womenRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const women = await Women.findById(req.params.id);
    if (women) {
      const deleteWomen = await women.remove();
      res.send({ message: 'Women Deleted', women: deleteWomen });
    } else {
      res.status(404).send({ message: 'Women Not Found' });
    }
  })
);

womenRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const womenId = req.params.id;
    const women = await Women.findById(womenId);
    if (women) {
      if (women.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      women.reviews.push(review);
      women.numReviews = women.reviews.length;
      women.rating =
        women.reviews.reduce((a, c) => c.rating + a, 0) /
        women.reviews.length;
      const updatedWomen = await women.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedWomen.reviews[updatedWomen.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'Women Not Found' });
    }
  })
);

export default womenRouter;