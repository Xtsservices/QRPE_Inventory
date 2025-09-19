const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',        // or 127.0.0.1
  user: 'root',             // your MySQL username
  password: '1qaz!QAZ',     // your MySQL password
  database: 'inventory'     // your DB name
});

module.exports = pool;