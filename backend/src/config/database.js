const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'mysql';

const dbConfig = {
  dialect,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || (dialect === 'postgres' ? 5432 : 3306),
  database: process.env.DB_NAME || 'wolvesville_vn',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'phamtranyennhi16',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

// Add SSL for production PostgreSQL (Render requires it)
if (process.env.NODE_ENV === 'production' && dialect === 'postgres') {
  dbConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

// Support DATABASE_URL connection string (Render provides this)
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  sequelize = new Sequelize(dbConfig);
}

module.exports = { sequelize };
