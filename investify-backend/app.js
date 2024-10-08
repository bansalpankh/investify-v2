import express from 'express';
const app = express();
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { OrderBook } from './priorityQueue.js';

dotenv.config();
app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000/',
  methods: ['GET', 'POST'],
  credentials: true
}));

const jwtSecret = process.env.JWT_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../investify-frontend/build')));

import mongoose from 'mongoose';
mongoose.connect("mongodb://127.0.0.1:27017/Investify")
.then(()=>{
  console.log("Connection Succeded");
}).catch((err)=>{
  console.log(err);
})

const oneDay = 60*60*24*1000;
app.use(session({
  secret: process.env.SECRET_KEY,
  saveUninitialized: true,
  cookie: {maxAge: oneDay},
  resave: false
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

const transporter = nodemailer.createTransport({
  service : 'gmail',
  auth: {
    user : 'shaurysingh84@gmail.com',
    pass : process.env.MAIL_PASS
  },
})

import generateOTP from "./generateOTP.js";
import generateRandomSequence from './generateRandomSessionID.js';
app.post('/send-otp',async (req,res)=>{
  try{
    const { email } = req.body;
    console.log(req.body);
    req.session.otp = await generateOTP(100000,999999);
    const mailOptions = {
      from : 'shaurysingh84@gmail.com',
      to : req.body.email,
      subject : 'Welcome To Investify! - OTP For Login',
      text : `Your OTP for Login at www.investify.in is: ${req.session.otp}. This OTP is only valid for the next 10 minutes. Please Do Not Share This OTP With Anyone even if the person claims to our employee.\nMutual Funds and Equity are subject to Market Risks. Please Analyze all the terms and conditions before Investing.\nHappy Investing!`
    }
    transporter.sendMail(mailOptions, (err,info)=>{
      if (err){
        return console.error(err);
      }
      console.log("Sent Successfully");
    })
    req.session.userId = await generateRandomSequence(16);
    req.session.token = jwt.sign({userId:req.session.userId},jwtSecret,{expiresIn:'1h'});
    console.log(req.session);
    res.status(200).send("Succesfull");
  }catch (error){
    console.log(error);
  }
})

const userSchema = new mongoose.Schema({
  userId : String,
  KYC : Boolean,
  uuID : String,
  userName : String,
  amount : Number
})
const user = new mongoose.model('users',userSchema);
import { findUser } from './searchIntoUser.js';
app.post('/verify-otp',async (req,res)=>{
  console.log(`session: ${req.session.otp}`);
  console.log(`req: ${req.body.otp}`);
  const user = await findUser(req.body.email)
  if (req.body.otp == req.session.otp){
    if (user){
      req.session.userId = user.uuID;
      res.status(200).send({"success" : true});
      console.log(req.session);
    } else{
      console.log(req.body);
      const body = {userId : req.body.email,KYC : false, uuID : req.session.userId, userName : req.body.email.slice(0,4), amount : 0}
      let saveobj = new user(body);
      saveobj.save().then(()=>{
        console.log("saved");
        res.status(200).send({"success" : true});
      })
    }
  } else{
    res.status(401).send({"success" : false});
  }
});

const authetication = (req,res,next) =>{
  if (req.session.token == null) return res.sendStatus(401);
  jwt.verify(req.session.token, jwtSecret, (err, user) => {
    if (err) return res.status(403).send('Forbidden');
    req.user = user;
    next();
  });
};

app.get('/api/invest/equity', authetication, async(req,res)=>{
  try{
    const Database = mongoose.connection;
    const StockData = Database.collection('Stocks');
    const stocks = StockData.find();
    const documents = await stocks.toArray();
    res.status(200).send(documents);
  } catch(err){
    console.log(err);
  }
});

app.get('/invest/equity',async (req,res)=>{
  if (!req.session.token){
    req.session.token = jwt.sign({userId:req.session.userId},jwtSecret,{expiresIn:'1h'});
  };
  console.log(req.session);
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

app.get('/invest/equity/:shareName', (req,res)=>{
  console.log(req.params.shareName);
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

let buyBook = [];
let sellBook = [];
const buySellBook = new OrderBook(buyBook,sellBook);
app.post('/invest/equity/:shareName/buy', async (req,res)=>{
  try{
    buySellBook.addIntoBuyBook(req.body.price,req.body.qty,req.params.shareName,req.session.userId);
    console.log('Updated buyBook:', buySellBook.buyBook);
    res.status(200).json({message: "Order added"});
  }catch(err){
    console.log(err);
  }
})

app.post('/invest/equity/:shareName/sell', (req,res)=>{
  buySellBook.addIntoSellBook(req.body.price,req.body.qty,req.params.shareName,req.session.userId);
  console.log('Updated sellBook:', buySellBook.sellBook);
  res.status(200).json({message: "Order added"});
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../investify-frontend/build', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});