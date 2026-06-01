const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'wolvesville_vn';
  
  console.log('--- Kế hoạch khởi tạo cơ sở dữ liệu MySQL ---');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Database: ${dbName}`);
  
  try {
    // 1. Kết nối không cần DB trước để tạo DB nếu chưa có
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true, // Cho phép chạy nhiều câu lệnh cùng lúc
    });
    
    console.log('✅ Đã kết nối tới MySQL Server.');
    
    // 2. Tạo DB mới sạch sẽ
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    await connection.query(`CREATE DATABASE \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Đã reset database "${dbName}" sạch sẽ.`);
    await connection.end();
    
    // 3. Kết nối trực tiếp vào DB để chạy file schema.mysql.sql
    const dbConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: dbName,
      multipleStatements: true,
    });
    
    console.log(`✅ Đã kết nối vào database "${dbName}".`);
    
    // Đọc file schema.mysql.sql
    const schemaPath = path.resolve(__dirname, '../../database/schema.mysql.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Không tìm thấy file schema tại: ${schemaPath}`);
    }
    
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    console.log('⏳ Đang chạy schema.mysql.sql (Khởi tạo bảng và Seed data)...');
    
    // Thực thi toàn bộ sql schema
    await dbConnection.query(sqlSchema);
    console.log('✅ Khởi tạo cơ sở dữ liệu MySQL thành công!');
    
    await dbConnection.end();
  } catch (error) {
    console.error('❌ Lỗi khởi tạo cơ sở dữ liệu:', error.message);
    process.exit(1);
  }
}

initDatabase();
