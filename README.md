# 🎓 LearnStream AI

> Transform YouTube videos into structured learning experiences with AI-powered summaries, key points, and interactive quizzes.

![LearnStream AI](https://img.shields.io/badge/LearnStream-AI%20Powered-blueviolet?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)

## ✨ Features

- 🎥 **YouTube Video Processing** - Paste any YouTube URL and extract learning content
- 📝 **AI-Generated Summaries** - Comprehensive summaries of video content
- 💡 **Key Learning Points** - Extracted main concepts and takeaways
- 🎯 **Interactive Quizzes** - 10-question quizzes to test your understanding
- 📊 **Learning History** - Track all your processed videos
- 👤 **User Profiles** - Personal dashboard with learning statistics
- 🌙 **Dark Mode** - Beautiful light and dark themes
- 🎨 **Modern UI** - Glassmorphism design with animated backgrounds

## 🖼️ Screenshots

<details>
<summary>Click to view screenshots</summary>

### Dashboard
![alt text](image.png)

### Quiz Interface
![alt text](image-1.png)

### Profile Page
![alt text](image-2.png)

</details>

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (free tier works)
- Google Gemini API key
- Python 3.x (for YouTube transcript extraction)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/learnstream-ai.git
   cd learnstream-ai
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

3. **Set up environment variables**

   **Server (.env)**
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-super-secret-jwt-key-here
   GEMINI_API_KEY=your-gemini-api-key
   CLIENT_URL=http://localhost:5173
   ```

   **Client (.env)**
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Install Python dependency**
   ```bash
   pip install youtube-transcript-api
   ```

5. **Start the development servers**
   ```bash
   # From root directory
   npm run dev
   
   # Or start separately:
   # Terminal 1 - Server
   cd server && npm run dev
   
   # Terminal 2 - Client
   cd client && npm run dev
   ```

6. **Open the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

## 🏗️ Project Structure

```
learnstream-ai/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # React components
│   │   │   └── context/    # React contexts (Auth, App)
│   │   ├── styles/         # CSS styles
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # AI & YouTube services
│   │   └── app.js          # Express app
│   ├── package.json
│   └── .env.example
│
├── package.json            # Root package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `VITE_API_URL` | Backend API URL (client) | Yes |

### Getting API Keys

1. **MongoDB Atlas**
   - Create account at [mongodb.com](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Get connection string from "Connect" → "Connect your application"

2. **Google Gemini API**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Use the `gemini-2.0-flash` model

## 📦 Deployment

### Deploy Full Stack to Vercel (Recommended)

This project is configured to deploy **both frontend and backend** to Vercel as a single deployment.

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **Don't change root directory** (leave it as root)

3. **Add Environment Variables**
   In Vercel project settings → Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learnstream
   JWT_SECRET=your-super-secret-jwt-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Deploy!**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-project.vercel.app`

### Deploy Frontend & Backend Separately

#### Frontend (Vercel/Netlify)

1. Create new project in [Railway](https://railway.app) or [Render](https://render.com)
2. Connect your GitHub repository
3. Set root directory to `server`
4. Add environment variables
5. Deploy!

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🛠️ API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/process` | Process YouTube video |
| GET | `/api/videos/history` | Get user's video history |
| GET | `/api/videos/:id` | Get specific video |
| DELETE | `/api/videos/:id` | Delete video |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/stats` | Update quiz stats |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for AI content generation
- [YouTube Transcript API](https://github.com/jdepoix/youtube-transcript-api) for caption extraction
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide Icons](https://lucide.dev/) for beautiful icons

## 📧 Contact

nishikantkumar9871@gmail.com

Project Link: [https://github.com//learnstream-ai](https://github.com/NishikantKumar-98/LearnStream_Ai.git)

---

<p align="center">
  Made with ❤️ for better learning
</p>
