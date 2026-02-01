# Trivia Game Backend API

Node.js + Express + MongoDB backend for the Trivia Game application.

## Features

- ✅ JWT-based authentication
- ✅ Email/password signup and login
- ✅ Google OAuth token verification
- ✅ User management with game counters
- ✅ Categories CRUD with real-time updates (SSE)
- ✅ Game session tracking
- ✅ Apple IAP receipt verification
- ✅ Admin role management
- ✅ Purchase history tracking

## Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Required
MONGODB_URI=mongodb://localhost:27017/trivia-game
JWT_SECRET=your-secret-key-here

# Optional but recommended
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
APPLE_SHARED_SECRET=your-apple-shared-secret
```

3. **Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Email/password registration
- `POST /signin` - Email/password login
- `POST /google` - Google OAuth login (verify ID token)
- `POST /reset-password` - Send password reset email

### Users (`/api/users`) [Protected]
- `GET /:id` - Get user info
- `GET /:id/game-data` - Get game count & unlimited status
- `POST /:id/start-game` - Decrement game count
- `POST /:id/initialize` - Initialize new user with free games

### Categories (`/api/categories`)
- `GET /` - Get all categories [Public]
- `POST /` - Save categories [Admin]
- `GET /subscribe` - Subscribe to real-time updates (SSE)

### Game Sessions (`/api/game-sessions`) [Protected]
- `POST /` - Create game session
- `GET /:id` - Get game session
- `PATCH /:id` - Update game session

### Purchases (`/api/purchases`) [Protected]
- `POST /verify` - Verify iOS/Android purchase
- `POST /process` - Process purchase & grant games
- `GET /:userId` - Get user purchase history

### Admin (`/api/admin`) [Admin Protected]
- `GET /admins` - List all admins
- `POST /users/:uid/admin` - Grant admin status
- `DELETE /users/:uid/admin` - Revoke admin status

## Creating an Admin User

1. Sign up a user via the app or API
2. Run the admin creation script:

```bash
npm run create-admin your-email@example.com
```

## Testing the API

### Using cURL

**Sign up:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'
```

**Sign in:**
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get categories:**
```bash
curl http://localhost:3000/api/categories
```

**Start a game (with auth):**
```bash
curl -X POST http://localhost:3000/api/users/USER_UID/start-game \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman or Thunder Client

1. Import the API endpoints
2. Set the base URL to `http://localhost:3000`
3. For protected routes, add `Authorization: Bearer <token>` header

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # MongoDB connection
│   │   └── jwt.ts            # JWT configuration
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── categoryController.ts
│   │   ├── gameSessionController.ts
│   │   ├── purchaseController.ts
│   │   └── adminController.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Category.ts
│   │   ├── GameSession.ts
│   │   └── Purchase.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── categories.ts
│   │   ├── gameSessions.ts
│   │   ├── purchases.ts
│   │   └── admin.ts
│   ├── services/
│   │   ├── tokenService.ts   # JWT generation/verification
│   │   ├── googleAuth.ts     # Google OAuth verification
│   │   └── appleReceipt.ts   # Apple IAP verification
│   ├── middleware/
│   │   ├── auth.ts           # JWT & admin middleware
│   │   └── errorHandler.ts  # Global error handler
│   ├── scripts/
│   │   └── createAdmin.ts    # Admin creation script
│   └── index.ts              # App entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment | No | development |
| `PORT` | Server port | No | 3000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration | No | 7d |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | - |
| `APPLE_SHARED_SECRET` | Apple IAP shared secret | No | - |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No | See .env.example |
| `INITIAL_FREE_GAMES` | Free games for new users | No | 3 |

## Security Considerations

### Production Checklist

- [ ] Set a strong `JWT_SECRET` (32+ random bytes)
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins (no wildcards)
- [ ] Enable rate limiting (already configured)
- [ ] Use environment variables for all secrets
- [ ] Set `NODE_ENV=production`
- [ ] Enable MongoDB authentication
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Implement proper logging
- [ ] Set up monitoring and alerts

### Password Security

- Passwords are hashed with bcrypt (12 salt rounds)
- Password reset tokens should expire (TODO: implement)
- Never log passwords or tokens

### JWT Security

- Tokens expire after 7 days
- Use HTTPS to prevent token interception
- Store tokens securely on client (localStorage or httpOnly cookies)

## Deployment

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your Git repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy!

### Deploy to Railway

1. Create a new project on Railway
2. Connect your Git repository
3. Add MongoDB plugin
4. Set environment variables
5. Deploy automatically

### Deploy to DigitalOcean App Platform

1. Create a new App
2. Connect your Git repository
3. Set build command and run command
4. Add MongoDB database
5. Configure environment variables

## Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running: `mongod --version`
- Verify connection string in `.env`
- For Atlas, check IP whitelist

### JWT Token Invalid
- Verify `JWT_SECRET` is set
- Check token expiration
- Ensure proper `Bearer <token>` format

### CORS Errors
- Add client URL to `ALLOWED_ORIGINS`
- Check if origin includes protocol (http://)
- For Capacitor: Use `capacitor://localhost` and `ionic://localhost`

### Google Sign-In Failed
- Verify `GOOGLE_CLIENT_ID` is set
- Check ID token is not expired
- Ensure email is verified

### Apple IAP Verification Failed
- Check `APPLE_SHARED_SECRET` is set
- Try sandbox URL if production fails
- Verify receipt format is correct

## Development Tips

### Watch Mode
```bash
npm run dev
```

### Check Database
```bash
# Using MongoDB shell
mongosh mongodb://localhost:27017/trivia-game

# List collections
show collections

# Find all users
db.users.find()

# Find admins
db.users.find({ isAdmin: true })
```

### Clear Database
```bash
mongosh mongodb://localhost:27017/trivia-game

# Drop entire database
db.dropDatabase()
```

## License

ISC

## Support

For issues or questions, please refer to the main project README or create an issue on GitHub.
