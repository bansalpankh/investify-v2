import mysql from 'mysql2';

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

export async function addOrderIntoDatabase(buyOrSell, shareName, price, qty, userID, date_of_order) {
    const query = `INSERT INTO orders (buy_or_sell, shareName, price, qty, userID, date_of_order) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [buyOrSell, shareName, price, qty, userID, date_of_order];
    connection.query(query, values, function(err, result) {
        if (err) throw err;
        console.log(result);
        console.log("1 Row Inserted");
    });
}

export async function addMatchedOrders(){};

createMatchedTable('matched_orders');