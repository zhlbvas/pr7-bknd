
const { MongoClient } = require("mongodb");
require("dotenv").config();

if (!process.env.MONGODB_URI) {
    throw new Error("Не задана переменная MONGODB_URI в файле .env");
}

const client = new MongoClient(process.env.MONGODB_URI);

let database = null;

async function connect() {
    if (database) {
        return database;
    }

    await client.connect();
    database = client.db("astana_guide");

    console.log("Облачная база данных подключена");

    return database;
}

function getCollection(name) {
    if (!database) {
        throw new Error("Сначала подключите базу данных");
    }

    return database.collection(name);
}

module.exports = {
    connect,
    getCollection
};
