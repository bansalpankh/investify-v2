import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MSQL_DATABASE
})

connection.connect((err)=>{
  if (err){
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log("Connected to Flights");
  console.log('Connected to MySQL as id ' + connection.threadId);
});