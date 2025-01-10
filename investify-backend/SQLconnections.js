import mysql from 'mysql2';
import { allStocksToArray } from './searchIntoUser.js';
import getOrderDate from './calculateOrderDate.js';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Dairymil1@',
    database: 'stocks'
});

connection.connect((err)=>{
    if (err){
        console.log('Connection Not Sucessfull');
        return;
    }
    console.log("Connected to MySQL");
})

function createTableOrders(tableName){
    const query = `Create table ${tableName} (buy_or_sell varchar(4), shareName varchar(25), price decimal(8,2), qty int, userID varchar(16), date_of_order date)`;
    connection.query(query, function(err,result){
        if (err){
            throw err;
        }
        console.log(result);
        console.log("1 Result Inserted");
    })
}

function createMatchedTable(tableName){
    const query = `Create table ${tableName} (buyID varchar(16), sellID varchar(16), price decimal(8,2), qty int, date_of_order date)`;
    connection.query(query, function(err, result){
        if (err) throw err;
        console.log(result);
        console.log("Success");
    })
}

function createPriceTable(tableName){
    const query = `Create table ${tableName} (price decimal(8,2), shareName varchar(25), date_of_record date,time_of_record time)`;
    connection.query(query, function(err,result){
        if (err) throw err;
        console.log(result);
        console.log("Sucess");
    })
}

export async function addOrderIntoDatabase(buyOrSell, shareName, price, qty, userID, date_of_order) {
    const query = `INSERT INTO orders (buy_or_sell, shareName, price, qty, userID, date_of_order) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [buyOrSell, shareName, price, qty, userID, date_of_order];
    connection.query(query, values, function(err, result) {
        if (err) throw err;
        console.log(result);
        console.log("1 Row Inserted");
    });
}

export async function addMatchedOrders({ buyID, sellID, price, qty, date_of_orders }) {
    const query = `INSERT INTO matched_orders (buyID, sellID, price, qty, date_of_order) VALUES (?,?,?,?,?)`;
    const values = [buyID, sellID, price, qty, date_of_orders];
    connection.query(query, values, function (err, result) {
        if (err) {
            console.error("Error inserting matched order:", err);
            return;
        }
        console.log(result);
        console.log("1 Row Inserted");
    });
}

export async function stockPriceUpdateMain(){
    let arrayI = [];
    const main = await allStocksToArray();
    arrayI.push(main);
    const query = "INSERT INTO price_table (price, shareName, date_of_record, time_of_record) VALUES ?";
    const values = arrayI;
    connection.query(query, values,function (err,result){
        if (err) throw err;
        console.log(result);
        console.log('50 rows inserted');
    });
}

export async function getGraphData(shareName) {
    const today = getOrderDate();
    const query = `SELECT price FROM price_table WHERE date_of_record = "${today}" AND shareName = "${shareName}" AND time_of_record >= "21:47:00"`;
    return new Promise((resolve, reject) => {
        connection.query(query, function(err, result) {
            if (err) {
                reject(err);
                return;
            }
            const prices = result.map(row => row.price);
            resolve(prices);
        });
    });
}