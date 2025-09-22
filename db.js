const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost", // or 127.0.0.1
  user: "root", // your MySQL username
  password: "kiran9966", // your MySQL password
  database: "inventory_db", // your DB name
});

module.exports = pool;
