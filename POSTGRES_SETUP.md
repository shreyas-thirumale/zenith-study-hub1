# PostgreSQL Setup Guide

## ✅ What's Been Created

I've set up a **dual-mode system**:

### Demo Users (In-Memory)
- ✅ No registration needed
- ✅ Data stored in RAM
- ✅ Resets on server restart
- ✅ Perfect for testing

### Real Users (PostgreSQL Database)
- ✅ Register with email/password
- ✅ Data stored permanently in database
- ✅ Survives server restarts
- ✅ Real authentication with bcrypt
- ✅ JWT tokens for security

## 📁 Files Created

```
backend/
├── src/
│   ├── db.js                      # PostgreSQL connection
│   ├── init-db.sql                # Database schema
│   ├── server-db.js               # New server with DB support
│   └── services/
│       ├── userService.js         # User authentication
│       └── dataService.js         # Data operations
└── setup-db.js                    # Database setup script
```

## 🚀 Setup Instructions

### Option 1: Vercel Postgres (Recommended for Vercel deployment)

1. **Create Vercel Postgres Database**
   ```bash
   # In Vercel Dashboard:
   # Your Project → Storage → Create Database → Postgres
   ```

2. **Copy Connection String**
   - Vercel will show you: `postgres://...`
   - Copy the entire connection string

3. **Add Environment Variables**
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   DATABASE_URL=postgres://your-connection-string
   JWT_SECRET=your-super-secret-key-change-this
   ```

4. **Setup Database Tables**
   ```bash
   cd backend
   npm run setup-db
   ```

5. **Update Vercel Config**
   - Change `src/server-simple.js` to `src/server-db.js` in vercel.json

### Option 2: Supabase (Free tier available)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for database to be ready

2. **Get Connection String**
   - Settings → Database → Connection string
   - Copy the "Connection pooling" URL
   - Replace `[YOUR-PASSWORD]` with your database password

3. **Add to Environment Variables**
   ```bash
   DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   JWT_SECRET=your-super-secret-key
   ```

4. **Run Setup Script**
   ```bash
   cd backend
   npm run setup-db
   ```

### Option 3: Local PostgreSQL (For development)

1. **Install PostgreSQL**
   ```bash
   # Mac
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql
   sudo service postgresql start
   ```

2. **Create Database**
   ```bash
   createdb zenith_study_hub
   ```

3. **Set Environment Variable**
   ```bash
   # Create .env file in backend/
   DATABASE_URL=postgresql://localhost/zenith_study_hub
   JWT_SECRET=your-secret-key-for-development
   ```

4. **Setup Database**
   ```bash
   cd backend
   npm run setup-db
   ```

## 🧪 Testing Locally

### Start with Database Support
```bash
cd backend
npm run dev:db
```

### Test Demo User (In-Memory)
```bash
# Get demo session
curl -X POST http://localhost:3333/api/auth/demo

# Use the token from response
curl http://localhost:3333/api/calendar \
  -H "Authorization: Bearer session-1234567890"
```

### Test Real User (Database)
```bash
# Register
curl -X POST http://localhost:3333/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the JWT token from response
curl http://localhost:3333/api/calendar \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique, not null
- `password_hash` - Bcrypt hashed password
- `name` - User's name
- `created_at` - Timestamp

### Courses Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `name` - Course name
- `code` - Course code
- `color` - Hex color code

### Calendar Events Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Event title
- `description` - Event description
- `date` - Event date
- `time` - Event time
- `type` - Event type (assignment, exam, etc.)
- `course_id` - Foreign key to courses

### Projects Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `name` - Project name
- `description` - Project description
- `course_id` - Foreign key to courses
- `due_date` - Due date
- `status` - Status (active, completed, etc.)
- `progress` - Progress percentage

### Focus Sessions Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `course_id` - Foreign key to courses
- `duration` - Duration in seconds
- `started_at` - Start timestamp
- `ended_at` - End timestamp
- `status` - Status (active, completed)

## 🔄 Deploying to Vercel

### Update vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server-db.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server-db.js"
    }
  ]
}
```

### Add Environment Variables in Vercel
1. Go to your backend project in Vercel
2. Settings → Environment Variables
3. Add:
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `JWT_SECRET` = A secure random string
   - `NODE_ENV` = `production`

### Deploy
```bash
cd backend
git add .
git commit -m "Add PostgreSQL support"
git push origin main
```

Vercel will auto-deploy!

## 🎯 How It Works

### Demo Users
- Click "Try Demo" → Gets `session-123456` token
- Data stored in RAM (in-memory arrays)
- Resets on server restart
- No database needed

### Real Users
- Register/Login → Gets JWT token
- Data stored in PostgreSQL database
- Persists forever
- Secure password hashing
- Real authentication

### The Magic
The server automatically detects token type:
- `session-*` → Demo mode (in-memory)
- JWT token → Real mode (database)

## 🔒 Security Features

✅ **Password Hashing** - bcrypt with salt rounds
✅ **JWT Tokens** - Secure, expiring tokens
✅ **SQL Injection Protection** - Parameterized queries
✅ **CORS** - Configured for security
✅ **Helmet** - Security headers
✅ **Rate Limiting** - Built-in protection

## 📈 Next Steps

1. ✅ Set up PostgreSQL database
2. ✅ Run setup script
3. ✅ Update vercel.json
4. ✅ Add environment variables
5. ✅ Deploy to Vercel
6. ✅ Test registration/login
7. ✅ Verify data persists

## 🆘 Troubleshooting

### "Connection refused"
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall/network settings

### "relation does not exist"
- Run `npm run setup-db` to create tables
- Check database permissions

### "Invalid token"
- JWT_SECRET must be the same on all instances
- Token might be expired (7 days)
- Try logging in again

### Demo mode not working
- Demo mode doesn't need database
- Should work immediately
- Check token format: `session-*`

## 💡 Tips

- Use Vercel Postgres for easiest setup
- Keep JWT_SECRET secure and random
- Backup your database regularly
- Monitor database usage
- Use connection pooling for better performance

---

**Your app now supports both demo users and real users with permanent storage!** 🎉
