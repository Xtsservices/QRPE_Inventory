const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',        // or 127.0.0.1
  user: 'root',             // your MySQL username
  password: 'kiran9966', // Your MySQL password
  database: 'inventory',  // Your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

});

module.exports = pool;
