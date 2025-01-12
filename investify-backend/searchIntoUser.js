import mongoose from "mongoose";
import getOrderDate, { getCurrentMySQLTime } from "./calculateOrderDate.js";
mongoose.connect("mongodb://127.0.0.1:27017/Investify")
.then(()=>{
  console.log("Connection Succeded");
}).catch((err)=>{
  console.log(err);
})

export async function findUser(email){
    const Database = mongoose.connection;
    const collection = Database.collection('users');
    const user = await collection.findOne({userId : email});
    if (user){
      return user;
    }else{
      return false;
    }
}

export async function findandUpdateUserId(userId,amount){
  const Database = mongoose.connection;
  const collection = Database.collection('users');
  const user = await collection.findOneAndUpdate({uuID : userId},{$set:{amount:amount}});
  if (user) return true;
  return false;
}


export async function getUpperCircuit(shareName){
  const Database = mongoose.connection;
  const collection = Database.collection('Stocks');
  const uppercirc = await collection.findOne({CODE:shareName});
  if (uppercirc){
    return uppercirc.Upper_Circuit;
  }else{
    return false;
  }
}
export async function getShareDetails(shareName){
  const Database = mongoose.connection;
  const collection = Database.collection('Stocks');
  const data = await collection.findOne({CODE:shareName});
  if (data){
    return data;
  }else{
    return false;
  }
}

export async function updateIntoMongoDB(shareName, price){
  const Database = mongoose.connection;
  const collection = Database.collection('Stocks');
  await collection.findOneAndUpdate({CODE:shareName},{$set:{Price:price}});
}

export async function allStocksToArray(){
  try {
      let arr = [];
      const Database = mongoose.connection;
      const StockData = Database.collection('Stocks');
      const stocks = await StockData.find();
      const documents = await stocks.toArray();
      const date = getOrderDate();
      const time = getCurrentMySQLTime();
      documents.forEach((i)=>{
        let newArr = [];
        newArr.push(i.Price);
        newArr.push(i.CODE);
        newArr.push(date);
        newArr.push(time);
        arr.push(newArr);
      })
      return arr;
    } catch (err) {
      console.log(err);
    }
}

// console.log(await allStocksToArray());
// console.log(await findandUpdateUserId("8QeZcVQVFweMLR5T",1200));
// console.log(await getUpperCircuit("BAJAJHFL"));