import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
class PriorityQueue {
    constructor(comparator) {
        this.items = [];
        this.comparator = comparator;
    }
    enqueue(item) {
        this.items.push(item);
        this.bubbleUp();
    }
    dequeue() {
        if (this.items.length === 0) return null;
        if (this.items.length === 1) return this.items.pop();
        const root = this.items[0];
        this.items[0] = this.items.pop();
        this.bubbleDown();
        return root;
    }
    peek() {
        return this.items[0] || null;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    bubbleUp() {
        let index = this.items.length - 1;
        const element = this.items[index];
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.items[parentIndex];
            if (this.comparator(element, parent) >= 0) break;
            this.items[index] = parent;
            index = parentIndex;
        }
        this.items[index] = element;
    }
    bubbleDown() {
        let index = 0;
        const length = this.items.length;
        const element = this.items[0];
        while (true) {
            let leftChildIndex = 2 * index + 1;
            let rightChildIndex = 2 * index + 2;
            let leftChild, rightChild;
            let swap = null;
            if (leftChildIndex < length) {
                leftChild = this.items[leftChildIndex];
                if (this.comparator(leftChild, element) < 0) {
                    swap = leftChildIndex;
                }
            }
            if (rightChildIndex < length) {
                rightChild = this.items[rightChildIndex];
                if (
                    (swap === null && this.comparator(rightChild, element) < 0) ||
                    (swap !== null && this.comparator(rightChild, leftChild) < 0)
                ) {
                    swap = rightChildIndex;
                }
            }
            if (swap === null) break;
            this.items[index] = this.items[swap];
            index = swap;
        }
        this.items[index] = element;
    }
}

export class OrderBook {
    constructor() {
        this.sellBook = new PriorityQueue((a, b) => a.price - b.price);
        this.buyBook = new PriorityQueue((a, b) => b.price - a.price);
        this.weightedAverageData = {};
        this.db = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: process.env.MYSQL_PASSWORD,
            database: process.env.Stocks
        });
        setInterval(() => this.updateWeightedAverage(), 60000);
    }
    async addIntoSellBook(price, qty, shareName, userID) {
        const order = { price, qty, share: shareName, time: new Date(), userID };
        this.sellBook.enqueue(order);
        await this.saveOrderToDB('sell', order);
        this.updateWeightedAverageData(shareName, price, qty);
    }
    async addIntoBuyBook(price, qty, shareName, userID) {
        const order = { price, qty, share: shareName, time: new Date(), userID };
        this.buyBook.enqueue(order);
        await this.saveOrderToDB('buy', order);
        this.updateWeightedAverageData(shareName, price, qty);
    }
    async saveOrderToDB(orderType, { price, qty, share, time, userID }) {
        const query = `INSERT INTO orders (type, price, qty, share_name, order_time, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [orderType, price, qty, share, time, userID];
        await this.db.execute(query, values);
    }
    updateWeightedAverageData(shareName, price, qty) {
        if (!this.weightedAverageData[shareName]) {
            this.weightedAverageData[shareName] = { totalVolume: 0, totalValue: 0, weightedAvgPrice: 0 };
        }
        const shareData = this.weightedAverageData[shareName];
        shareData.totalVolume += qty;
        shareData.totalValue += price * qty;
    }
    async updateWeightedAverage() {
        const date = new Date().toISOString().split('T')[0];
        const timeIndex = new Date().getMinutes();
        for (const [shareName, { totalVolume, totalValue }] of Object.entries(this.weightedAverageData)) {
            if (totalVolume > 0) {
                const weightedAvgPrice = totalValue / totalVolume;
                this.weightedAverageData[shareName].weightedAvgPrice = weightedAvgPrice;
                await this.updatePriceInDatabase(shareName, date, timeIndex, weightedAvgPrice);
                this.weightedAverageData[shareName].totalVolume = 0;
                this.weightedAverageData[shareName].totalValue = 0;
            }
        }
    }
    async updatePriceInDatabase(shareName, date, timeIndex, price) {
        const field = `time_${timeIndex}`;
        const query = `INSERT INTO weighted_averages (shareName, date, ${field})VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ${field} = VALUES(${field})`;
        const values = [shareName, date, price];
        await this.db.execute(query, values);
    }
}