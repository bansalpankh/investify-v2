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
  process.exit(1);
});

const oneDay = 60 * 60 * 24 * 1000;
const sessionMiddleware = session({
  secret: process.env.SECRET_KEY,
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false,
  secure: true
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

const Orderbook = new OrderBook();
io.on('connection', (socket)=>{
  const session = socket.request.session;
  console.log('User Connected on Investify');
  socket.on('joinSharedRoom',(shareName)=>{
    socket.join(shareName);
  })
  socket.on('buyOrder', async (order)=>{
    let chgBef = await fetchChangefromDB(order.shareName);
    const upperC = await getUpperCircuit(order.shareName);
    const lowerc = await getLowerCircuit(order.shareName);
    // will be combined as a single function to reduce wait times in investify-v3
    const abs = await Orderbook.getCurrentMarketValue(order.shareName,upperC,lowerc);
    // will provide relativly faster load times as written in log(n)
    if (session && session.userId && session.amount>=(order.price*order.qty)){
      session.amount = parseFloat((session.amount - (order.price*order.qty)).toFixed(2));
      Orderbook.addBuyOrder(order.price, order.qty, order.shareName, session.userId);
      const isUpdated = await findandUpdateUserId(session.userId,session.amount);
      // will be combined with addUserSharesIntoMongoDB
      if (isUpdated){
        await addOrderIntoDatabase("buy",order.shareName,order.price,order.qty,session.userId,getOrderDate());
        await addUserSharesIntoMongoDB(order.shareName,session.userId,order.qty);
        Orderbook.matchOrders();
      }
      if (!isUpdated){
        console.log("Order Can't Be Placed, Insuffienct Funds");
      }
      const currentValue = Orderbook.getCurrentMarketValue(order.shareName,upperC,lowerc);
      if (abs == currentValue){
        await updateIntoMongoDB(order.shareName,currentValue,chgBef);
      }else{
        chgBef = parseFloat((currentValue - abs).toFixed(2));
        await updateIntoMongoDB(order.shareName,currentValue,chgBef);
      }
      const changePerc = parseFloat(((chgBef/abs)*100).toFixed(2));
      io.to(order.shareName).emit('updateMarketValue', {currentValue,changePerc});
    } else {
      console.log('order is not defined for this session');
    }
  })
  socket.on('sellOrder',async (order)=>{
    let chgBef = await fetchChangefromDB(order.shareName);
    const upperC = await getUpperCircuit(order.shareName);
    const lowerc = await getLowerCircuit(order.shareName);
    // will be combined as a single function to reduce wait times in investify-v3
    const abs = await Orderbook.getCurrentMarketValue(order.shareName,upperC,lowerc);
    // will provide relativly faster load times as written in log(n)
    console.log(`upercircuit: ${upperC}, abs: ${abs}`);
    if (session && session.userId){
      Orderbook.addSellOrder(order.price, order.qty, order.shareName, session.userId);
      await addOrderIntoDatabase("sell",order.shareName,order.price,order.qty,session.userId,getOrderDate());
      Orderbook.matchOrders();
      const currentValue = Orderbook.getCurrentMarketValue(order.shareName,upperC,lowerc);
      if (abs == currentValue){
        await updateIntoMongoDB(order.shareName,currentValue,chgBef);
      }else{
        chgBef = parseFloat((currentValue-abs).toFixed(2));
      }
      const changePerc = parseFloat(((chgBef/abs)*100).toFixed(2));
      await updateIntoMongoDB(order.shareName,currentValue,chgBef);
      io.to(order.shareName).emit('updateMarketValue', {currentValue,changePerc});
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
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_PASS
  },
});

import generateOTP from "./generateOTP.js";
import generateRandomSequence from './generateRandomSessionID.js';
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    // console.log(req.body);
    req.session.otp = await generateOTP(100000, 999999);
    const mailOptions = {
      from: process.env.MAIL_ID,
      to: email,
      subject: 'Welcome To Investify! - OTP For Login',
      text: `Your OTP for Login at www.investify.in is: ${req.session.otp}. This OTP is only valid for the next 10 minutes. Please Do Not Share This OTP With Anyone even if the person claims to our employee.\nMutual Funds and Equity are subject to Market Risks. Please Analyze all the terms and conditions before Investing.\nHappy Investing!`
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return console.error(err);
      }
      // console.log("Sent Successfully");
    });
    req.session.userId = await generateRandomSequence(16);
    req.session.token = jwt.sign({ userId: req.session.userId }, jwtSecret, { expiresIn: '1h' });
    // console.log(req.session);
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
  amount: Number,
  sharesBought: Array
});

const user = new mongoose.model('users', userSchema);
import { addUserSharesIntoMongoDB, fetchChangefromDB, findandUpdateUserId, findUser, getLowerCircuit, getUpperCircuit, updateIntoMongoDB } from './searchIntoUser.js';
import OrderBook from './priorityQueue.js';
app.post('/verify-otp', async (req, res) => {
  try {
    // console.log(`session: ${req.session.otp}`);
    // console.log(`req: ${req.body.otp}`);
    const user_ = await findUser(req.body.email);
    if (req.body.otp == req.session.otp) {
      if (user_) {
        req.session.userId = user_.uuID;
        req.session.amount = user_.amount;
        res.status(200).send({ "success": true });
        console.log(req.session);
      } else {
        const body = { userId: req.body.email, KYC: true, uuID: req.session.userId, userName: req.body.email.slice(0, 4), amount: 60000000, sharesBought: [] };
        req.session.amount = body.amount;
        let saveobj = new user(body);
        saveobj.save().then(() => {
          // console.log("saved");
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
    if (err) return res.sendStatus(403).send('Forbidden');
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

app.get('/api/invest/getChart/:shareName',authetication,async (req,res)=>{
  try{
    const shareName = req.params.shareName;
    let priceDataArray = await getGraphData(shareName);
    res.status(200).send(priceDataArray);
  }catch(err){
    console.log(err);
  }
})

import { getShareDetails } from './searchIntoUser.js';
import { addOrderIntoDatabase, getGraphData, getUserInvestments, getUserTotalInvestment, stockPriceUpdateMain } from './SQLconnections.js';
import getOrderDate from './calculateOrderDate.js';
app.get('/api/invest/equity/getDetails/:shareName',authetication,async (req,res)=>{
  const shareName = req.params.shareName;
  try{
    const data = await getShareDetails(shareName);
    res.status(200).send(data);
  }catch(err){
    console.log(err);
  }
})

app.get('/api/user/totalInvestments', authetication, async (req, res) => {
  try {
    console.log('User session:', req.session);
    if (!req.session.userId) {
      console.log('No user logged in.');
      return res.status(401).send('Unauthorized');
    }
    const data = await getUserTotalInvestment(req.session.userId);
    console.log('Total investment:', data);
    res.status(200).send(data.toString());
  } catch (err) {
    console.error('Backend error:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/api/user/allInvestments',authetication,async(req,res)=>{
  try{
    if (req.session.userId){
      const data = await getUserInvestments(req.session.userId);
      res.status(200).send(data);
    }
  }catch(err){
    res.status(404).send('Not Found');
  }
})

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

setInterval(async () => {
  await stockPriceUpdateMain();
}, 60000);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});