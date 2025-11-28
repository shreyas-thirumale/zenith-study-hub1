const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const userService = require('./services/userService');
const dataService = require('./services/dataService');

const app = express();

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory data store for DEMO users only
let demoData = {
  calendar_events: [],
  projects: [],
  focus_sessions: [],
  courses: []
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth middleware - distinguishes between real users and demo users
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (token.startsWith('session-')) {
    // Demo user - use in-memory storage
    req.userId = parseInt(token.replace('session-', ''));
    req.isDemo = true;
    next();
  } else {
    // Real user - verify JWT and use database
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.isDemo = false;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Zenith Study Hub API is running!',
    endpoints: [
      '/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/demo',
      '/api/calendar',
      '/api/projects',
      '/api/focus',
      '/api/courses'
    ]
  });
});

// ===== AUTH ROUTES =====

// Demo session (in-memory only)
app.post('/api/auth/demo', (req, res) => {
  const sessionId = Date.now() + Math.floor(Math.random() * 1000000);
  const demoUser = {
    id: sessionId,
    email: `demo-${sessionId}@zenith.app`,
    name: 'Demo User',
    created_at: new Date().toISOString()
  };
  
  res.json({
    user: { id: demoUser.id, email: demoUser.email, name: demoUser.name },
    token: `session-${sessionId}`
  });
});

// Register (database)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    // Check if user exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = await userService.createUser(email, password, name);
    
    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login (database)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Find user
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await userService.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ===== COURSES ROUTES =====

app.get('/api/courses', authMiddleware, async (req, res) => {
  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const courses = demoData.courses.filter(c => c.user_id === req.userId);
      res.json(courses);
    } else {
      // Real user - database
      const courses = await dataService.getCourses(req.userId);
      res.json(courses);
    }
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to get courses' });
  }
});

app.post('/api/courses', authMiddleware, async (req, res) => {
  const { name, code, color } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Course name and code are required' });
  }

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const newCourse = {
        id: demoData.courses.length + 1,
        name,
        code,
        color: color || '#6B7280',
        user_id: req.userId,
        created_at: new Date().toISOString()
      };
      demoData.courses.push(newCourse);
      res.status(201).json(newCourse);
    } else {
      // Real user - database
      const course = await dataService.createCourse(req.userId, name, code, color || '#6B7280');
      res.status(201).json(course);
    }
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// ===== CALENDAR ROUTES =====

app.get('/api/calendar', authMiddleware, async (req, res) => {
  const { start, end } = req.query;

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      let events = demoData.calendar_events.filter(e => e.user_id === req.userId);
      if (start && end) {
        events = events.filter(e => e.date >= start && e.date <= end);
      }
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      res.json(events);
    } else {
      // Real user - database
      const events = await dataService.getCalendarEvents(req.userId, start, end);
      res.json(events);
    }
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

app.post('/api/calendar', authMiddleware, async (req, res) => {
  const { title, description, date, time, type, course_id } = req.body;

  if (!title || !date || !type) {
    return res.status(400).json({ error: 'Title, date, and type are required' });
  }

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const newEvent = {
        id: demoData.calendar_events.length + 1,
        title,
        description: description || '',
        date,
        time: time || null,
        type,
        course_id: course_id || null,
        user_id: req.userId,
        created_at: new Date().toISOString()
      };
      demoData.calendar_events.push(newEvent);
      res.status(201).json(newEvent);
    } else {
      // Real user - database
      const event = await dataService.createCalendarEvent(req.userId, req.body);
      res.status(201).json(event);
    }
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

app.put('/api/calendar/:id', authMiddleware, async (req, res) => {
  const eventId = parseInt(req.params.id);

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const eventIndex = demoData.calendar_events.findIndex(e => e.id === eventId && e.user_id === req.userId);
      if (eventIndex === -1) {
        return res.status(404).json({ error: 'Event not found' });
      }
      demoData.calendar_events[eventIndex] = {
        ...demoData.calendar_events[eventIndex],
        ...req.body,
        updated_at: new Date().toISOString()
      };
      res.json(demoData.calendar_events[eventIndex]);
    } else {
      // Real user - database
      const event = await dataService.updateCalendarEvent(eventId, req.userId, req.body);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    }
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});

app.delete('/api/calendar/:id', authMiddleware, async (req, res) => {
  const eventId = parseInt(req.params.id);

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const eventIndex = demoData.calendar_events.findIndex(e => e.id === eventId && e.user_id === req.userId);
      if (eventIndex === -1) {
        return res.status(404).json({ error: 'Event not found' });
      }
      demoData.calendar_events.splice(eventIndex, 1);
      res.json({ message: 'Event deleted successfully' });
    } else {
      // Real user - database
      const event = await dataService.deleteCalendarEvent(eventId, req.userId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ message: 'Event deleted successfully' });
    }
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

// ===== PROJECTS ROUTES =====

app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const projects = demoData.projects
        .filter(p => p.user_id === req.userId)
        .map(project => {
          const course = demoData.courses.find(c => c.id === project.course_id);
          return { ...project, course_name: course ? course.name : null };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      res.json(projects);
    } else {
      // Real user - database
      const projects = await dataService.getProjects(req.userId);
      res.json(projects);
    }
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const newProject = {
        id: demoData.projects.length + 1,
        ...req.body,
        status: req.body.status || 'active',
        progress: req.body.progress || 0,
        user_id: req.userId,
        created_at: new Date().toISOString()
      };
      const course = demoData.courses.find(c => c.id === newProject.course_id);
      const projectWithCourse = { ...newProject, course_name: course ? course.name : null };
      demoData.projects.push(newProject);
      res.status(201).json(projectWithCourse);
    } else {
      // Real user - database
      const project = await dataService.createProject(req.userId, req.body);
      res.status(201).json(project);
    }
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
  const projectId = parseInt(req.params.id);

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const projectIndex = demoData.projects.findIndex(p => p.id === projectId && p.user_id === req.userId);
      if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }
      demoData.projects[projectIndex] = {
        ...demoData.projects[projectIndex],
        ...req.body,
        updated_at: new Date().toISOString()
      };
      const course = demoData.courses.find(c => c.id === demoData.projects[projectIndex].course_id);
      const projectWithCourse = { ...demoData.projects[projectIndex], course_name: course ? course.name : null };
      res.json(projectWithCourse);
    } else {
      // Real user - database
      const project = await dataService.updateProject(projectId, req.userId, req.body);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    }
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  const projectId = parseInt(req.params.id);

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const projectIndex = demoData.projects.findIndex(p => p.id === projectId && p.user_id === req.userId);
      if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
      }
      demoData.projects.splice(projectIndex, 1);
      res.json({ message: 'Project deleted successfully' });
    } else {
      // Real user - database
      const project = await dataService.deleteProject(projectId, req.userId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ message: 'Project deleted successfully' });
    }
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ===== FOCUS SESSIONS ROUTES =====

app.get('/api/focus/sessions', authMiddleware, async (req, res) => {
  const { limit = 50 } = req.query;

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const sessions = demoData.focus_sessions
        .filter(s => s.user_id === req.userId)
        .map(session => {
          const course = demoData.courses.find(c => c.id === session.course_id);
          return { ...session, course_name: course ? course.name : null };
        })
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
        .slice(0, parseInt(limit));
      res.json(sessions);
    } else {
      // Real user - database
      const sessions = await dataService.getFocusSessions(req.userId, parseInt(limit));
      res.json(sessions);
    }
  } catch (error) {
    console.error('Get focus sessions error:', error);
    res.status(500).json({ error: 'Failed to get focus sessions' });
  }
});

app.post('/api/focus/start', authMiddleware, async (req, res) => {
  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const newSession = {
        id: demoData.focus_sessions.length + 1,
        course_id: req.body.course_id || null,
        duration: req.body.duration || 1800,
        started_at: new Date().toISOString(),
        ended_at: null,
        user_id: req.userId,
        status: 'active',
        notes: null
      };
      const course = demoData.courses.find(c => c.id === newSession.course_id);
      const sessionWithCourse = { ...newSession, course_name: course ? course.name : null };
      demoData.focus_sessions.push(newSession);
      res.status(201).json(sessionWithCourse);
    } else {
      // Real user - database
      const session = await dataService.createFocusSession(req.userId, req.body);
      res.status(201).json(session);
    }
  } catch (error) {
    console.error('Start focus session error:', error);
    res.status(500).json({ error: 'Failed to start focus session' });
  }
});

app.post('/api/focus/:id/end', authMiddleware, async (req, res) => {
  const sessionId = parseInt(req.params.id);

  try {
    if (req.isDemo) {
      // Demo user - in-memory
      const session = demoData.focus_sessions.find(s => s.id === sessionId && s.user_id === req.userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      session.ended_at = new Date().toISOString();
      session.status = 'completed';
      res.json(session);
    } else {
      // Real user - database
      const session = await dataService.endFocusSession(sessionId, req.userId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    }
  } catch (error) {
    console.error('End focus session error:', error);
    res.status(500).json({ error: 'Failed to end focus session' });
  }
});

// Syllabus routes (placeholder)
app.post('/api/syllabus/parse', authMiddleware, (req, res) => {
  res.json({
    course_name: '',
    assignments: [],
    exams: []
  });
});

app.post('/api/syllabus/create-events', authMiddleware, (req, res) => {
  res.status(201).json({ message: 'Events created successfully', events: [] });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/health`);
  });
}

// Export for Vercel serverless
module.exports = app;
