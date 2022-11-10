import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import data from '../data.js';
import User from '../Models/userModel.js';
import bcrypt from 'bcryptjs';
import { generateToken, isAuth, isAdmin } from '../utils.js';

const userRouter = express.Router();

userRouter.get(
    '/top-sellers',
    expressAsyncHandler(async(req, res) => {
        const topSellers = await User.find({ isSeller: true })
            .sort({ 'seller.rating': -1 })
            .limit(3);
        res.send(topSellers);
        // console.log('topSellers');
    })
);

userRouter.get('/seed', expressAsyncHandler(async(req, res) => {
    // await User.remove({});
    const createdUsers = await User.insertMany(data.users);
    res.send({ createdUsers });
}));

userRouter.post(
    '/signin',
    expressAsyncHandler(async(req, res) => {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            if (bcrypt.compareSync(req.body.password, user.password)) {
                res.send({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    isSeller: user.isSeller,
                    token: generateToken(user),
                });
                return;
            }
        }
        res.status(401).send({ message: 'Invalid email or password' });
    })
);

userRouter.post(
    '/accountin',
    expressAsyncHandler(async(req, res) => {
        const accountin = await User.findOne({ email: req.body.email });
        if (accountin) {
            if (bcrypt.compareSync(req.body.password, accountin.password)) {
                res.send({
                    _id: accountin._id,
                    name: accountin.name,
                    email: accountin.email,
                    isAdmin: accountin.isAdmin,
                    isSeller: accountin.isSeller,
                    token: generateToken(accountin),
                });
                return;
            }
        }
        res.status(401).send({ message: 'Invalid email' });
    })
);

userRouter.post(
    '/accountcreation',
    expressAsyncHandler(async(req, res) => {
        const accountcreation = await User.findOne({ email: req.body.email });
        if (User) {
            if (bcrypt.compareSync(req.body.password, accountcreation.password)) {
                res.send({
                    _id: accountcreation._id,
                    name: accountcreation.name,
                    email: accountcreation.email,
                    isAdmin: accountcreation.isAdmin,
                    isSeller: accountcreation.isSeller,
                    token: generateToken(accountcreation),
                });
                return;
            }
        }
        res.status(401).send({ message: 'Invalid email' });
    })
);

userRouter.post(
    '/adminin',
    expressAsyncHandler(async(req, res) => {
        const adminin = await User.findOne({ email: req.body.email });
        if (adminin) {
            if (bcrypt.compareSync(req.body.password, adminin.password)) {
                res.send({
                    _id: adminin._id,
                    name: adminin.name,
                    email: adminin.email,
                    isAdmin: adminin.isAdmin,
                    isSeller: adminin.isSeller,
                    token: generateToken(adminin),
                });
                return;
            }
        }
        res.status(401).send({ message: 'Invalid email or password' });
    })
);

userRouter.post(
    '/register',
    expressAsyncHandler(async(req, res) => {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
        });
        const registerUser = await user.save();
        res.send({
            _id: registerUser._id,
            name: registerUser.name,
            email: registerUser.email,
            isAdmin: registerUser.isAdmin,
            isSeller: user.isSeller,
            token: generateToken(registerUser),
        });
    })
);

// userRouter.post(
//   '/account',
//   expressAsyncHandler(async (req, res) => {
//     const user = new User({
//       name: req.body.name,
//       email: req.body.email,
//       password: bcrypt.hashSync(req.body.password,8),
//     });
//     const accountUser = await user.save();
//     res.send({
//       _id:accountUser._id,
//       name: accountUser.name,
//       email: accountUser.email,
//       isAdmin:accountUser.isAdmin,
//       isSeller: user.isSeller,
//       token: generateToken(accountUser),

//     });
//   })
// );


// userRouter.post(
//   '/accountcreation',
//   expressAsyncHandler(async (req, res) => {
//     const accountcreation = new User({
//       name: req.body.name,
//       email: req.body.email,
//       password: bcrypt.hashSync(req.body.password, 8),
//     });
//     const accountcreation = await user.save();
//     res.send({
//       _id: accountcreation._id,
//       name: accountcreation.name,
//       email: accountcreation.email,
//       isAdmin: accountcreation.isAdmin,
//       isSeller: accountcreation.isSeller,
//       token: generateToken(accountcreation),

//     });
//   })
// );

userRouter.post(
    '/adminin',
    expressAsyncHandler(async(req, res) => {
        const admin = await User.findOne({ email: req.body.email });
        if (admin) {
            if (bcrypt.compareSync(req.body.password, admin.password)) {
                res.send({
                    _id: adminuser._id,
                    name: adminuser.name,
                    email: adminuser.email,
                    isAdmin: adminuser.isAdmin,
                    isSeller: adminuser.isSeller,
                    token: generateToken(adminuser),
                });
                return;
            }
        }
        res.status(401).send({ message: 'Invalid email or password' });
    })
);
userRouter.get(
    '/:id',
    expressAsyncHandler(async(req, res) => {
        const user = await User.findById(req.params.id);
        if (user) {
            res.send(user);
        } else {
            res.status(404).send({ message: 'User Not Found' });
        }
    })
);

userRouter.put(
    '/profile',
    isAuth,
    expressAsyncHandler(async(req, res) => {
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (user.isSeller) {
                user.seller.name = req.body.sellerName || user.seller.name;
                user.seller.logo1 = req.body.sellerLogo1 || user.seller.logo1;
                user.seller.logo2 = req.body.sellerLogo2 || user.seller.logo2;
                user.seller.logo3 = req.body.sellerLogo3 || user.seller.logo3;
                user.seller.logo4 = req.body.sellerLogo4 || user.seller.logo4;
                user.seller.description =
                    req.body.sellerDescription || user.seller.description;
            }
            if (req.body.password) {
                user.password = bcrypt.hashSync(req.body.password, 8);
            }
            const updatedUser = await user.save();
            res.send({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                isSeller: user.isSeller,
                token: generateToken(updatedUser),
            });
        }
    })
);

userRouter.get(
    '/',
    isAuth,
    isAdmin,
    expressAsyncHandler(async(req, res) => {
        const users = await User.find({});
        res.send(users);
    })
);

userRouter.get(
    '/',
    isAuth,
    isAdmin,
    expressAsyncHandler(async(req, res) => {
        const accountin = await User.find({});
        res.send(accountin);
    })
);

userRouter.delete(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async(req, res) => {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.email === 'admin@example.com') {
                res.status(400).send({ message: 'Can Not Delete Admin User' });
                return;
            }
            const deleteUser = await user.remove();
            res.send({ message: 'User Deleted', user: deleteUser });
        } else {
            res.status(404).send({ message: 'User Not Found' });
        }
    })
);

userRouter.put(
    '/:id',
    isAuth,
    isAdmin,
    expressAsyncHandler(async(req, res) => {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            // user.isSeller = req.body.isSeller || user.isSeller;

            // user.isAdmin = req.body.isAdmin || user.isAdmin;
            user.isSeller = Boolean(req.body.isSeller);
            user.isAdmin = Boolean(req.body.isAdmin);

            const updatedUser = await user.save();
            res.send({ message: 'User Updated', user: updatedUser });
        } else {
            res.status(404).send({ message: 'User Not Found' });
        }
    })
);


export default userRouter;