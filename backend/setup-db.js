const fs = require('fs');
const pool = require('./src/db');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Read SQL file
    const sql = fs.readFileSync('./src/init-db.sql', 'utf8');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ Database setup complete!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - courses');
    console.log('   - calendar_events');
    console.log('   - projects');
    console.log('   - focus_sessions');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
