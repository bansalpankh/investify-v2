import mongoose from "mongoose";
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