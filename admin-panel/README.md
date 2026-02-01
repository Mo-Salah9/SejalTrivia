# 🎮 Trivia Game - Admin Panel

A comprehensive web-based admin panel to manage your trivia game.

## ✨ Features

### 👥 Users Management
- View all registered users
- Edit user game credits (lives)
- Grant/revoke unlimited games
- Grant/revoke admin access
- Search users by email or name
- View user statistics (total games played, provider, etc.)

### 📂 Categories Management
- View all categories and questions
- Add new categories
- Edit category names (English & Arabic)
- Delete categories
- Add new questions to categories
- Edit questions (English & Arabic)
- Delete questions
- Save all changes to backend

### ⚙️ Settings
- Configure default free games for new users
- View backend information
- System configuration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend API running (Railway)

### Installation

```bash
cd admin-panel
npm install
```

### Development

```bash
npm run dev
```

The admin panel will be available at http://localhost:3001

### Production Build

```bash
npm run build
```

The production files will be in the `dist` folder.

## 🔐 Login

Use your admin account credentials to login:
- Email: Your admin email
- Password: Your password

**Note**: Only users with `isAdmin: true` can access the admin panel.

## 📝 Configuration

Edit `.env` file to configure:

```env
VITE_API_BASE_URL=https://your-backend-url.up.railway.app/api
```

## 🎯 Usage

### Managing Users

1. Navigate to **Users** tab
2. Search for users using the search bar
3. Click **Edit** on any user to:
   - Change games remaining
   - Toggle unlimited games
   - Grant/revoke admin access

### Managing Categories

1. Navigate to **Categories** tab
2. Click **Add Category** to create new category
3. Click **Edit** on any category to modify name
4. Click **Add Question** to add questions to a category
5. Edit or delete questions as needed
6. Click **Save All** to persist changes to backend

### System Settings

1. Navigate to **Settings** tab
2. Adjust default free games for new users
3. Click **Save Settings**

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CSS** - Styling (no external UI library for lightweight bundle)

## 📦 Deployment

### Deploy to Railway

1. Push admin-panel folder to GitHub
2. Create new Railway project
3. Connect GitHub repository
4. Set root directory to `admin-panel`
5. Add environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-url.up.railway.app/api
   ```
6. Deploy!

### Deploy to Vercel

```bash
cd admin-panel
vercel
```

### Deploy to Netlify

```bash
cd admin-panel
npm run build
netlify deploy --prod --dir=dist
```

## 🔒 Security

- Admin panel requires authentication
- Only users with `isAdmin: true` can access
- JWT tokens used for API authentication
- HTTPS enforced in production

## 📸 Screenshots

### Users Management
Manage all registered users, edit game credits, grant unlimited access

### Categories Management
Add, edit, and delete categories and questions in both English and Arabic

### Settings
Configure system-wide settings like default free games

## 🆘 Support

If you encounter any issues:
1. Check backend is running
2. Verify environment variables
3. Check browser console for errors
4. Verify admin credentials

## 📄 License

Private - For internal use only
