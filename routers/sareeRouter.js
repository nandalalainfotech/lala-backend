// import express from 'express';
// import expressAsyncHandler from 'express-async-handler';
// import data from '../data.js';
// import Saree from '../Models/sareeModel.js';
// import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
// import User from '../Models/userModel.js';

// const sareeRouter = express.Router();

// sareeRouter.get(
//   '/',
//   expressAsyncHandler(async (req, res) => {
//     const pageSize = 3;
//     const page = Number(req.query.pageNumber) || 1;
//     const name = req.query.name || '';
//     const seller = req.query.seller || '';
//     const category = req.query.category || '';
//     const order = req.query.order || '';
//     const min =
//       req.query.min && Number(req.query.min) !== 0 ? Number(req.query.min) : 0;
//     const max =
//       req.query.max && Number(req.query.max) !== 0 ? Number(req.query.max) : 0;
//     const rating =
//       req.query.rating && Number(req.query.rating) !== 0
//         ? Number(req.query.rating)
//         : 0;




//     const nameFilter = name ? { name: { $regex: name, $options: 'i' } } : {};
//     const sellerFilter = seller ? { seller } : {};
//     const categoryFilter = category ? { category } : {};

//     const priceFilter = min && max ? { price: { $gte: min, $lte: max } } : {};
//     const ratingFilter = rating ? { rating: { $gte: rating } } : {};
//     const sortOrder =
//       order === 'lowest'
//         ? { price: 1 }
//         : order === 'highest'
//           ? { price: -1 }
//           : order === 'toprated'
//             ? { rating: -1 }
//             : { _id: -1 };
//     const count = await Saree.count({
//       ...sellerFilter,
//       ...nameFilter,
//       ...categoryFilter,
//       ...priceFilter,
//       ...ratingFilter,
//     });
//     // const sarees = await saree.find({ ...sellerFilter });
//     const sarees = await Saree.find({
//       ...sellerFilter,
//       ...nameFilter,
//       ...categoryFilter,
//       ...priceFilter,
//       ...ratingFilter,
//     })
//       .populate('seller', 'seller.name seller.logo')
//       //     .sort(sortOrder);
//       //   res.send(sarees);
//       .sort(sortOrder)
//       .skip(pageSize * (page - 1))
//       .limit(pageSize);
//     res.send({ sarees, page, pages: Math.ceil(count / pageSize) });
//   })
// );


// sareeRouter.get(
//   '/categories',
//   expressAsyncHandler(async (req, res) => {
//     const categories = await Saree.find().distinct('category');
//     res.send(categories);
//   })
// );

// sareeRouter.get(
//   '/seed',
//   expressAsyncHandler(async (req, res) => {
//     await Saree.remove({});
//     // const createdSarees = await saree.insertMany(data.sarees);
//     // res.send({ createdsarees });
//     const seller = await User.findOne({ isSeller: true });
//     if (seller) {
//       const sarees = data.sarees.map((saree) => ({
//         ...saree,
//         seller: seller._id,
//       }));
//       const createdSarees = await Saree.insertMany(sarees);
//       res.send({ createdSaree });
//     } else {
//       res
//         .status(500)
//         .send({ message: 'No seller found. first run /api/users/seed' });
//     }
//   })
// );

// sareeRouter.get(
//   '/:id',
//   expressAsyncHandler(async (req, res) => {
//     // const saree = await Saree.findById(req.params.id);
//     const saree = await Saree.findById(req.params.id).populate(
//       'seller',
//       'seller.name seller.logo seller.rating seller.numReviews'
//     );
//     if (saree) {
//       res.send(saree);
//     } else {
//       res.status(404).send({ message: 'Saree Not Found' });
//     }
//   })
// );

// sareeRouter.post(
//   '/',
//   isAuth,
//   isAdmin,
//   isSellerOrAdmin,
//   expressAsyncHandler(async (req, res) => {
//     const saree = new Saree({
//       name: 'sample name ' + Date.now(),
//       seller: req.user._id,
//       image: '/image/p1.jpg',
//       price: 0,
//       category: 'sample category',
//       brand: 'sample brand',
//       countInStock: 0,
//       rating: 0,
//       numReviews: 0,
//       description: 'sample description',
//     });
//     const createdSaree = await saree.save();
//     res.send({ message: 'Saree Created', saree: createdSaree });
//   })
// );
// sareeRouter.put(
//   '/:id',
//   isAuth,
//   isAdmin,
//   isSellerOrAdmin,
//   expressAsyncHandler(async (req, res) => {
//     const sareeId = req.params.id;
//     const saree = await Saree.findById(sareeId);
//     if (saree) {
//       saree.name = req.body.name;
//       saree.price = req.body.price;
//       saree.image = req.body.image;
//       saree.images = req.body.images;
//       saree.category = req.body.category;
//       saree.brand = req.body.brand;
//       saree.countInStock = req.body.countInStock;
//       saree.description = req.body.description;
//       const updatedSaree = await saree.save();
//       res.send({ message: 'Saree Updated', saree: updatedSaree });
//     } else {
//       res.status(404).send({ message: 'Saree Not Found' });
//     }
//   })
// );
// sareeRouter.delete(
//   '/:id',
//   isAuth,
//   isAdmin,
//   expressAsyncHandler(async (req, res) => {
//     const saree = await Saree.findById(req.params.id);
//     if (saree) {
//       const deleteSaree = await saree.remove();
//       res.send({ message: 'Saree Deleted', saree: deleteSaree });
//     } else {
//       res.status(404).send({ message: 'Saree Not Found' });
//     }
//   })
// );

// sareeRouter.post(
//   '/:id/reviews',
//   isAuth,
//   expressAsyncHandler(async (req, res) => {
//     const sareeId = req.params.id;
//     const saree = await Saree.findById(sareeId);
//     if (saree) {
//       if (saree.reviews.find((x) => x.name === req.user.name)) {
//         return res
//           .status(400)
//           .send({ message: 'You already submitted a review' });
//       }
//       const review = {
//         name: req.user.name,
//         rating: Number(req.body.rating),
//         comment: req.body.comment,
//       };
//       saree.reviews.push(review);
//       saree.numReviews = saree.reviews.length;
//       saree.rating =
//         saree.reviews.reduce((a, c) => c.rating + a, 0) 
//         saree.reviews.length;
//       const updatedSaree = await saree.save();
//       res.status(201).send({
//         message: 'Review Created',
//         review: updatedSaree.reviews[updatedSaree.reviews.length - 1],
//       });
//     } else {
//       res.status(404).send({ message: 'Saree Not Found' });
//     }
//   })
// );

// export default sareeRouter;

import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';
import saree from '../Models/sareeModel.js';
import { isAdmin, isAuth, isSellerOrAdmin } from '../utils.js';
import User from '../Models/userModel.js';

const sareeRouter = express.Router();

sareeRouter.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const pageSize = 3;
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
    const count = await saree.count({
      ...sellerFilter,
      ...nameFilter,
     ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    // const sarees = await saree.find({ ...sellerFilter });
    const sarees = await saree.find({
        ...sellerFilter,
        ...nameFilter,
         ...categoryFilter,
        ...priceFilter,
        ...ratingFilter,
      })
        .populate('seller', 'seller.name seller.logo')
    //     .sort(sortOrder);
    //   res.send(sarees);
        .sort(sortOrder)
        .skip(pageSize * (page - 1))
        .limit(pageSize);
      res.send({ sarees, page, pages: Math.ceil(count / pageSize) });
    })
  );
   

sareeRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await saree.find().distinct('category');
    res.send(categories);
  })
);

sareeRouter.get(
  '/seed',
  expressAsyncHandler(async (req, res) => {
    await saree.remove({});
    // const createdsarees = await saree.insertMany(data.sarees);
    // res.send({ createdsarees });
    const seller = await User.findOne({ isSeller: true });
    if (seller) {
      const sarees = data.sarees.map((saree) => ({
        ...saree,
        seller: seller._id,
      }));
      const createdsarees = await saree.insertMany(sarees);
      res.send({ createdsarees });
    } else {
      res
        .status(500)
        .send({ message: 'No seller found. first run /api/users/seed' });
    }
  })
);

sareeRouter.post(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    // const saree = await saree.findById(req.params.id);
    const saree = await saree.findById(req.params.id).populate(
      'seller',
      'seller.name seller.logo seller.rating seller.numReviews'
    );
    if (saree) {
      res.send(saree);
    } else {
      res.status(404).send({ message: 'saree Not Found' });
    }
  })
);

sareeRouter.post(
  '/',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const saree = new Saree({
      name: 'sample name ' + Date.now(),
      seller: req.user._id,
      image: '/image/p12.jpg',
      price: 0,
      category: 'sample category',
      brand: 'sample brand',
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });
    const createdsaree = await saree.save();
    res.send({ message: 'saree Created', saree: createdsaree });
  })
);
sareeRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
   
    const sareeId = req.params.id;
    const saree = await saree.findById(sareeId);
    if (saree) {
      saree.name = req.body.name;
      saree.price = req.body.price;
      saree.image = req.body.image;
      saree.category = req.body.category;
      saree.brand = req.body.brand;
      saree.countInStock = req.body.countInStock;
      saree.description = req.body.description;
      const updatedsaree = await Sarees.save();
      res.send({ message: 'saree Updated', saree: updatedsaree });
    } else {
      res.status(404).send({ message: 'saree Not Found' });
    }
  })
);
sareeRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const saree = await saree.findById(req.params.id);
    if (saree) {
      const deletesaree = await saree.remove();
      res.send({ message: 'saree Deleted', saree: deletesaree });
    } else {
      res.status(404).send({ message: 'saree Not Found' });
    }
  })
);

sareeRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const sareeId = req.params.id;
    const saree = await saree.findById(sareeId);
    if (saree) {
      if (saree.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      saree.reviews.push(review);
      saree.numReviews = saree.reviews.length;
      saree.rating =
        saree.reviews.reduce((a, c) => c.rating + a, 0) /
        saree.reviews.length;
      const updatedsaree = await saree.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedsaree.reviews[updatedsaree.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: 'saree Not Found' });
    }
  })
);

export default sareeRouter;