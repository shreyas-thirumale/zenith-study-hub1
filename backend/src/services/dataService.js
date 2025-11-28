const pool = require('../db');

class DataService {
  // ===== COURSES =====
  async getCourses(userId) {
    const result = await pool.query(
      'SELECT * FROM courses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async createCourse(userId, name, code, color) {
    const result = await pool.query(
      'INSERT INTO courses (user_id, name, code, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, code, color]
    );
    return result.rows[0];
  }

  // ===== CALENDAR EVENTS =====
  async getCalendarEvents(userId, start, end) {
    let query = 'SELECT * FROM calendar_events WHERE user_id = $1';
    const params = [userId];

    if (start && end) {
      query += ' AND date >= $2 AND date <= $3';
      params.push(start, end);
    }

    query += ' ORDER BY date ASC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  async createCalendarEvent(userId, data) {
    const { title, description, date, time, type, course_id } = data;
    const result = await pool.query(
      'INSERT INTO calendar_events (user_id, title, description, date, time, type, course_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, title, description, date, time, type, course_id]
    );
    return result.rows[0];
  }

  async updateCalendarEvent(eventId, userId, data) {
    const { title, description, date, time, type, course_id } = data;
    const result = await pool.query(
      'UPDATE calendar_events SET title = $1, description = $2, date = $3, time = $4, type = $5, course_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *',
      [title, description, date, time, type, course_id, eventId, userId]
    );
    return result.rows[0];
  }

  async deleteCalendarEvent(eventId, userId) {
    const result = await pool.query(
      'DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING *',
      [eventId, userId]
    );
    return result.rows[0];
  }

  // ===== PROJECTS =====
  async getProjects(userId) {
    const result = await pool.query(
      `SELECT p.*, c.name as course_name 
       FROM projects p 
       LEFT JOIN courses c ON p.course_id = c.id 
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async createProject(userId, data) {
    const { name, description, course_id, due_date, status, progress } = data;
    const result = await pool.query(
      'INSERT INTO projects (user_id, name, description, course_id, due_date, status, progress) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, description, course_id, due_date, status || 'active', progress || 0]
    );
    
    // Get course name if course_id exists
    if (result.rows[0].course_id) {
      const courseResult = await pool.query('SELECT name FROM courses WHERE id = $1', [result.rows[0].course_id]);
      result.rows[0].course_name = courseResult.rows[0]?.name || null;
    }
    
    return result.rows[0];
  }

  async updateProject(projectId, userId, data) {
    const { name, description, course_id, due_date, status, progress } = data;
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2, course_id = $3, due_date = $4, status = $5, progress = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *',
      [name, description, course_id, due_date, status, progress, projectId, userId]
    );
    
    // Get course name if course_id exists
    if (result.rows[0]?.course_id) {
      const courseResult = await pool.query('SELECT name FROM courses WHERE id = $1', [result.rows[0].course_id]);
      result.rows[0].course_name = courseResult.rows[0]?.name || null;
    }
    
    return result.rows[0];
  }

  async deleteProject(projectId, userId) {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *',
      [projectId, userId]
    );
    return result.rows[0];
  }

  // ===== FOCUS SESSIONS =====
  async getFocusSessions(userId, limit = 50) {
    const result = await pool.query(
      `SELECT fs.*, c.name as course_name 
       FROM focus_sessions fs 
       LEFT JOIN courses c ON fs.course_id = c.id 
       WHERE fs.user_id = $1 
       ORDER BY fs.started_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async createFocusSession(userId, data) {
    const { course_id, duration } = data;
    const result = await pool.query(
      'INSERT INTO focus_sessions (user_id, course_id, duration, started_at, status) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING *',
      [userId, course_id, duration || 1800, 'active']
    );
    
    // Get course name if course_id exists
    if (result.rows[0].course_id) {
      const courseResult = await pool.query('SELECT name FROM courses WHERE id = $1', [result.rows[0].course_id]);
      result.rows[0].course_name = courseResult.rows[0]?.name || null;
    }
    
    return result.rows[0];
  }

  async endFocusSession(sessionId, userId) {
    const result = await pool.query(
      'UPDATE focus_sessions SET ended_at = CURRENT_TIMESTAMP, status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      ['completed', sessionId, userId]
    );
    return result.rows[0];
  }
}

module.exports = new DataService();
