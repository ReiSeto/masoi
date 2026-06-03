/**
 * Script to initialize PostgreSQL database on Render.com
 * Usage: node init_pg.js <DATABASE_URL>
 */
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Usage: node init_pg.js <DATABASE_URL>');
  process.exit(1);
}

async function initDatabase() {
  const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Read and execute schema as a whole transaction
    const schemaPath = path.resolve(__dirname, '..', 'database', 'schema.postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute entire schema as one query
    await sequelize.query(schema);
    console.log('✅ Schema executed successfully');

    console.log('\n🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    // If it's a partial error, let's still log success for created items
    if (error.message.includes('already exists')) {
      console.log('⚠️ Some objects already exist (this is OK for re-runs)');
    }
  } finally {
    await sequelize.close();
  }
}

initDatabase();
