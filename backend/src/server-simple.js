const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// In-memory data store - all start empty
let users = [];
let calendar_events = [];
let projects = [];
let focus_sessions = [];
let courses = [];

// ID counters
let nextEventId = 1;
let nextProjectId = 1;
let nextSessionId = 1;
let nextCourseId = 1;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || token === 'mock-jwt-token-123') {
    req.userId = 1; // Mock user ID
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
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
      '/api/calendar',
      '/api/projects',
      '/api/focus',
      '/api/courses'
    ]
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    // Find or create user (simplified for demo)
    let user = users.find(u => u.email === email);
    if (!user) {
      user = {
        id: users.length + 1,
        email,
        name: email.split('@')[0],
        created_at: new Date().toISOString()
      };
      users.push(user);
    }
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token: 'mock-jwt-token-123'
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (email && password && name) {
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
      id: users.length + 1,
      email,
      name,
      created_at: new Date().toISOString()
    };
    users.push(newUser);

    res.status(201).json({
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token: 'mock-jwt-token-123'
    });
  } else {
    res.status(400).json({ error: 'All fields required' });
  }
});

// Calendar routes
app.get('/api/calendar', authMiddleware, (req, res) => {
  const { start, end } = req.query;
  let events = calendar_events.filter(e => e.user_id === req.userId);
  
  // Filter by date range if provided
  if (start && end) {
    events = events.filter(e => e.date >= start && e.date <= end);
  }
  
  // Sort by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.json(events);
});

app.post('/api/calendar', authMiddleware, (req, res) => {
  const { title, description, date, time, type, course_id } = req.body;
  
  if (!title || !date || !type) {
    return res.status(400).json({ error: 'Title, date, and type are required' });
  }

  const newEvent = {
    id: nextEventId++,
    title,
    description: description || '',
    date,
    time: time || null,
    type,
    course_id: course_id || null,
    user_id: req.userId,
    created_at: new Date().toISOString()
  };

  calendar_events.push(newEvent);
  res.status(201).json(newEvent);
});

app.put('/api/calendar/:id', authMiddleware, (req, res) => {
  const eventId = parseInt(req.params.id);
  const eventIndex = calendar_events.findIndex(e => e.id === eventId && e.user_id === req.userId);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { title, description, date, time, type, course_id } = req.body;
  
  calendar_events[eventIndex] = {
    ...calendar_events[eventIndex],
    title: title || calendar_events[eventIndex].title,
    description: description !== undefined ? description : calendar_events[eventIndex].description,
    date: date || calendar_events[eventIndex].date,
    time: time !== undefined ? time : calendar_events[eventIndex].time,
    type: type || calendar_events[eventIndex].type,
    course_id: course_id !== undefined ? course_id : calendar_events[eventIndex].course_id,
    updated_at: new Date().toISOString()
  };

  res.json(calendar_events[eventIndex]);
});

app.delete('/api/calendar/:id', authMiddleware, (req, res) => {
  const eventId = parseInt(req.params.id);
  const eventIndex = calendar_events.findIndex(e => e.id === eventId && e.user_id === req.userId);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  calendar_events.splice(eventIndex, 1);
  res.json({ message: 'Event deleted successfully' });
});

// Projects routes
app.get('/api/projects', authMiddleware, (req, res) => {
  const userProjects = projects
    .filter(p => p.user_id === req.userId)
    .map(project => {
      const course = courses.find(c => c.id === project.course_id);
      return {
        ...project,
        course_name: course ? course.name : null
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(userProjects);
});

app.post('/api/projects', authMiddleware, (req, res) => {
  const { name, description, course_id, due_date, status } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const newProject = {
    id: nextProjectId++,
    name,
    description: description || '',
    course_id: course_id || null,
    due_date: due_date || null,
    status: status || 'active',
    progress: 0,
    user_id: req.userId,
    created_at: new Date().toISOString()
  };

  const course = courses.find(c => c.id === newProject.course_id);
  const projectWithCourse = {
    ...newProject,
    course_name: course ? course.name : null
  };

  projects.push(newProject);
  res.status(201).json(projectWithCourse);
});

app.put('/api/projects/:id', authMiddleware, (req, res) => {
  const projectId = parseInt(req.params.id);
  const projectIndex = projects.findIndex(p => p.id === projectId && p.user_id === req.userId);
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { name, description, course_id, due_date, status, progress } = req.body;
  
  projects[projectIndex] = {
    ...projects[projectIndex],
    name: name || projects[projectIndex].name,
    description: description !== undefined ? description : projects[projectIndex].description,
    course_id: course_id !== undefined ? course_id : projects[projectIndex].course_id,
    due_date: due_date !== undefined ? due_date : projects[projectIndex].due_date,
    status: status || projects[projectIndex].status,
    progress: progress !== undefined ? progress : projects[projectIndex].progress,
    updated_at: new Date().toISOString()
  };

  const course = courses.find(c => c.id === projects[projectIndex].course_id);
  const projectWithCourse = {
    ...projects[projectIndex],
    course_name: course ? course.name : null
  };

  res.json(projectWithCourse);
});

app.delete('/api/projects/:id', authMiddleware, (req, res) => {
  const projectId = parseInt(req.params.id);
  const projectIndex = projects.findIndex(p => p.id === projectId && p.user_id === req.userId);
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects.splice(projectIndex, 1);
  res.json({ message: 'Project deleted successfully' });
});

// Focus routes
app.get('/api/focus/sessions', authMiddleware, (req, res) => {
  const { limit = 50 } = req.query;
  
  const userSessions = focus_sessions
    .filter(s => s.user_id === req.userId)
    .map(session => {
      const course = courses.find(c => c.id === session.course_id);
      return {
        ...session,
        course_name: course ? course.name : null
      };
    })
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, parseInt(limit));
  
  res.json(userSessions);
});

app.post('/api/focus/start', authMiddleware, (req, res) => {
  const { course_id, duration } = req.body;
  
  const newSession = {
    id: nextSessionId++,
    course_id: course_id || null,
    duration: duration || 1800, // Default 30 minutes
    started_at: new Date().toISOString(),
    ended_at: null,
    user_id: req.userId,
    status: 'active',
    notes: null
  };

  const course = courses.find(c => c.id === newSession.course_id);
  const sessionWithCourse = {
    ...newSession,
    course_name: course ? course.name : null
  };

  focus_sessions.push(newSession);
  res.status(201).json(sessionWithCourse);
});

app.post('/api/focus/:id/end', authMiddleware, (req, res) => {
  const sessionId = parseInt(req.params.id);
  const session = focus_sessions.find(s => s.id === sessionId && s.user_id === req.userId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.ended_at = new Date().toISOString();
  session.status = 'completed';
  
  res.json(session);
});

// Courses routes
app.get('/api/courses', authMiddleware, (req, res) => {
  res.json(courses);
});

app.post('/api/courses', authMiddleware, (req, res) => {
  const { name, code, color } = req.body;
  
  if (!name || !code) {
    return res.status(400).json({ error: 'Course name and code are required' });
  }

  const newCourse = {
    id: nextCourseId++,
    name,
    code,
    color: color || '#6B7280',
    user_id: req.userId,
    created_at: new Date().toISOString()
  };

  courses.push(newCourse);
  res.status(201).json(newCourse);
});

// Syllabus routes
app.post('/api/syllabus/parse', authMiddleware, (req, res) => {
  // Placeholder for future syllabus parsing functionality
  // In production, this would parse PDF/document files
  res.json({
    course_name: '',
    assignments: [],
    exams: []
  });
});

app.post('/api/syllabus/create-events', authMiddleware, (req, res) => {
  const { course_id, assignments, exams } = req.body;
  
  const createdEvents = [];
  
  // Create assignment events
  if (assignments) {
    assignments.forEach((assignment, index) => {
      const event = {
        id: calendar_events.length + createdEvents.length + 1,
        title: assignment.title,
        date: assignment.due_date,
        type: 'assignment',
        course_id,
        user_id: req.userId
      };
      createdEvents.push(event);
    });
  }
  
  // Create exam events
  if (exams) {
    exams.forEach((exam, index) => {
      const event = {
        id: calendar_events.length + createdEvents.length + 1,
        title: exam.title,
        date: exam.date,
        type: 'exam',
        course_id,
        user_id: req.userId
      };
      createdEvents.push(event);
    });
  }
  
  calendar_events.push(...createdEvents);
  res.status(201).json({ message: 'Events created successfully', events: createdEvents });
});

// Error handling middleware (must be last)
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