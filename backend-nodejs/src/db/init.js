const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
require('dotenv').config();

async function initDatabase() {
  try {
    console.log('🔄 Iniciando la creación de la base de datos...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schema);
    
    console.log('✅ Schema creado exitosamente');

    // Verificar si existe un admin
    const adminCheck = await pool.query(
      "SELECT COUNT(*) FROM user_roles WHERE role = 'admin'"
    );

    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('📝 No se encontró un administrador. Creando usuario admin por defecto...');
      
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, full_name) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        ['admin@cargoguardian.com', passwordHash, 'Administrador']
      );

      const userId = userResult.rows[0].id;

      await pool.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')`,
        [userId]
      );

      await pool.query(
        `INSERT INTO profiles (user_id, full_name) VALUES ($1, $2)`,
        [userId, 'Administrador']
      );

      console.log('✅ Usuario admin creado:');
      console.log('   📧 Email: admin@cargoguardian.com');
      console.log('   🔑 Password: admin123');
      console.log('   ⚠️  Cambia esta contraseña en producción!');
    }

    console.log('\n🚀 Base de datos lista!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    process.exit(1);
  }
}

initDatabase();
