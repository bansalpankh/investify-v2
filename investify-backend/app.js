import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);
const io = new Server(server);

dotenv.config();
app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5000/',
  methods: ['GET', 'POST'],
  credentials: true
}));

const jwtSecret = process.env.JWT_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../investify-frontend/build')));

import mongoose from 'mongoose';
mongoose.connect("mongodb://127.0.0.1:27017/Investify")
  .then(() => {
    console.log("Connection Succeded");
  }).catch((err) => {
    console.log(err);
  });

const oneDay = 60 * 60 * 24 * 1000;
const sessionMiddleware = session({
  secret: process.env.SECRET_KEY,
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false,
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// const roomBuyArrays = {};
// const roomSellArrays = {};
// io.on('connection', (socket) => {
//   const session = socket.request.session;
//   console.log('User Connected on Investify');
//   socket.on('joinSharedRoom', (shareName) => {
//     socket.join(shareName);
//     console.log(`user joined ${shareName} shared Room`);
//     roomBuyArrays[shareName] = roomBuyArrays[shareName] || [];
//     roomSellArrays[shareName] = roomSellArrays[shareName] || [];
//     socket.emit('roomArray', roomBuyArrays[shareName]);
//     socket.emit('roomArray', roomSellArrays[shareName]);
//   });
//   socket.on('buyOrder', (order) => {
//     if (session && session.userId) {
//       order.userID = session.userId;
//       roomBuyArrays[order.shareName].push(order);
//       console.log(roomBuyArrays);
//     } else {
//       console.error("userId is undefined in session for buyOrder");
//     }
//   });
//   socket.on('sellOrder', (order) => {
//     if (session && session.userId) {
//       order.userID = session.userId;
//       roomSellArrays[order.shareName].push(order);
//       console.log(roomSellArrays[order.shareName]);
//     } else {
//       console.error("userId is undefined in session for sellOrder");
//     }
//   });
// });

const Orderbook = new OrderBook();
io.on('connection', (socket)=>{
  const session = socket.request.session;
  console.log('User Connected on Investify');
  socket.on('joinSharedRoom',(shareName)=>{
    socket.join(shareName);
    console.log(`user joined ${shareName} shared Room`);
  })
  socket.on('buyOrder', async (order)=>{
    if (session && session.userId){
      Orderbook.addBuyOrder(order.price, order.qty, order.shareName, session.userId);
      Orderbook.matchOrders();
      const currentValue = Orderbook.getCurrentMarketValue(order.shareName);
      io.to(order.shareName).emit('updateMarketValue', currentValue);
      console.log('Order Added in the buy book');
      console.log(Orderbook.buyBook);
    } else {
      console.log('order is not defined for this session');
    }
  })
  socket.on('sellOrder',async (order)=>{
    if (session && session.userId){
      Orderbook.addSellOrder(order.price, order.qty, order.shareName, session.userId);
      Orderbook.matchOrders();
      const currentValue = Orderbook.getCurrentMarketValue(order.shareName);
      io.to(order.shareName).emit('updateMarketValue', currentValue);
      console.log('Order Added in the sell book');
      console.log(Orderbook.sellBook);
    } else {
      console.log('order is not defined for this session');
    }
  })
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shaurysingh84@gmail.com',
    pass: process.env.MAIL_PASS
  },
});

import generateOTP from "./generateOTP.js";
import generateRandomSequence from './generateRandomSessionID.js';
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);
    req.session.otp = await generateOTP(100000, 999999);
    const mailOptions = {
      from: 'shaurysingh84@gmail.com',
      to: email,
      subject: 'Welcome To Investify! - OTP For Login',
      text: `Your OTP for Login at www.investify.in is: ${req.session.otp}. This OTP is only valid for the next 10 minutes. Please Do Not Share This OTP With Anyone even if the person claims to our employee.\nMutual Funds and Equity are subject to Market Risks. Please Analyze all the terms and conditions before Investing.\nHappy Investing!`
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return console.error(err);
      }
      console.log("Sent Successfully");
    });
    req.session.userId = await generateRandomSequence(16);
    req.session.token = jwt.sign({ userId: req.session.userId }, jwtSecret, { expiresIn: '1h' });
    console.log(req.session);
    res.status(200).send("Successful");
  } catch (error) {
    console.log(error);
  }
});

const userSchema = new mongoose.Schema({
  userId: String,
  KYC: Boolean,
  uuID: String,
  userName: String,
  amount: Number
});
const user = new mongoose.model('users', userSchema);
import { findUser } from './searchIntoUser.js';
import OrderBook from './priorityQueue.js';
app.post('/verify-otp', async (req, res) => {
  try {
    console.log(`session: ${req.session.otp}`);
    console.log(`req: ${req.body.otp}`);
    const user_ = await findUser(req.body.email);
    if (req.body.otp == req.session.otp) {
      if (user_) {
        req.session.userId = user_.uuID;
        res.status(200).send({ "success": true });
        console.log(req.session);
      } else {
        const body = { userId: req.body.email, KYC: false, uuID: req.session.userId, userName: req.body.email.slice(0, 4), amount: 0 };
        let saveobj = new user(body);
        saveobj.save().then(() => {
          console.log("saved");
          res.status(200).send({ "success": true });
        });
      }
    } else {
      res.status(401).send({ "success": false });
    }
  } catch (error) {
    console.log(error);
  }
});

const authetication = (req, res, next) => {
  if (!req.session.token) return res.sendStatus(401);
  jwt.verify(req.session.token, jwtSecret, (err, user) => {
    if (err) return res.status(403).send('Forbidden');
    req.user = user;
    next();
  });
};

app.get('/api/invest/equity', authetication, async (req, res) => {
  try {
    const Database = mongoose.connection;
    const StockData = Database.collection('Stocks');
    const stocks = StockData.find();
    const documents = await stocks.toArray();
    res.status(200).send(documents);
  } catch (err) {
    console.log(err);
  }
});

app.get('/invest/equity', async (req, res) => {
  if (!req.session.token) {
    req.session.token = jwt.sign({ userId: req.session.userId }, jwtSecret, { expiresIn: '1h' });
  }
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

app.get('/invest/equity/:shareName', (req, res) => {
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});