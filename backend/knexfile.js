
require('dotenv').config();

module.exports = {
  client: process.env.DB_TYPE === 'mysql' ? 'mysql2' : 
          process.env.DB_TYPE === 'sqlite' ? 'sqlite3' : 'pg',
  connection: process.env.DB_TYPE === 'mysql' ? {
    host: process.env.SQL_HOST, 
    port: process.env.SQL_PORT, 
    user: process.env.SQL_USER, 
    password: process.env.SQL_PASSWORD, 
    database: process.env.SQL_DATABASE
  } : process.env.DB_TYPE === 'sqlite' ? {
    filename: process.env.SQL_DATABASE
  } : {
    host: process.env.SQL_HOST || '127.0.0.1', 
    port: process.env.SQL_PORT || 5432, 
    user: process.env.SQL_USER || 'postgres', 
    password: process.env.SQL_PASSWORD || '', 
    database: process.env.SQL_DATABASE || 'fastwings'
  },
  migrations: { directory: __dirname + '/migrations' },
  useNullAsDefault: process.env.DB_TYPE === 'sqlite'
};
