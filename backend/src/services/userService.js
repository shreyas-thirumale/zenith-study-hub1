const pool = require('../db');
const bcrypt = require('bcryptjs');

class UserService {
  // Create new user
  async createUser(email, password, name) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );
    return result.rows[0];
  }

  // Find user by email
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Verify password
  async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }

  // Get user by ID
  async findById(id) {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = new UserService();
