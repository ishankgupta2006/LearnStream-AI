/**
 * API Service Module
 * 
 * This file contains all API calls that need to be implemented by the backend.
 * Currently using mock data - replace with actual API calls when backend is ready.
 * 
 * Base URL should be configured via environment variable:
 * VITE_API_BASE_URL=https://your-server.vercel.app/api
 */

// Remove trailing slash and ensure /api suffix
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
API_BASE_URL = API_BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL + '/api';
}

/**
 * Helper function for making API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
     throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// AUTHENTICATION APIs
// ============================================

/**
 * Register a new user
 * POST /api/auth/register
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123",
 *   "name": "John Doe"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "avatar": "https://...",
 *     "createdAt": "2026-01-24T...",
 *     "stats": { ... }
 *   },
 *   "token": "jwt-token"
 * }
 */
export async function registerUser(email, password, name) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

/**
 * Login user
 * POST /api/auth/login
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "user": { ... },
 *   "token": "jwt-token"
 * }
 */
export async function loginUser(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logoutUser(refreshTokenValue) {
  return apiRequest('/auth/logout', { 
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshToken(refreshTokenValue) {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

/**
 * Get current user profile
 * GET /api/auth/me
 * 
 * Requires: Authorization header with JWT token
 */
export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

/**
 * Update user profile
 * PATCH /api/auth/profile
 * 
 * Request Body (partial update):
 * {
 *   "name": "New Name",
 *   "avatar": "https://..."
 * }
 */
export async function updateProfile(updates) {
  return apiRequest('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ============================================
// VIDEO PROCESSING APIs
// ============================================

/**
 * Process a YouTube video
 * POST /api/videos/process
 * 
 * Request Body:
 * {
 *   "videoUrl": "https://www.youtube.com/watch?v=...",
 *   "videoTitle": "Optional custom title"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "jobId": "uuid",
 *   "status": "processing"
 * }
 * 
 * Note: This should be an async operation. Use polling or WebSockets
 * to get the processing status and results.
 */
export async function processVideo(videoUrl, videoTitle, folderId = null) {
  return apiRequest('/videos/process', {
    method: 'POST',
    body: JSON.stringify({
      videoUrl,
      videoTitle,
      folderId
    }),
  });
}

/**
 * Get video processing status
 * GET /api/videos/status/:jobId
 * 
 * Response:
 * {
 *   "jobId": "uuid",
 *   "status": "processing" | "completed" | "failed",
 *   "progress": 0-100,
 *   "currentStep": "transcribing" | "summarizing" | "extracting" | "quiz-generation",
 *   "result": { ... } // Only when completed
 * }
 */
export async function getProcessingStatus(jobId) {
  return apiRequest(`/videos/status/${jobId}`);
}

/**
 * Get processed video content
 * GET /api/videos/:videoId
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "videoUrl": "https://...",
 *   "videoTitle": "Video Title",
 *   "videoId": "youtube-video-id",
 *   "thumbnail": "https://...",
 *   "duration": 1234, // seconds
 *   "processedAt": "2026-01-24T...",
 *   "summary": "...",
 *   "keyPoints": ["point1", "point2", ...],
 *   "quiz": [
 *     {
 *       "id": 1,
 *       "question": "...",
 *       "options": ["A", "B", "C", "D"],
 *       "correctAnswer": 0,
 *       "explanation": "..."
 *     }
 *   ]
 * }
 */
export async function getVideoContent(videoId) {
  return apiRequest(`/videos/${videoId}`);
}
export async function createVideoNote(videoId, text, timestamp) {
  return apiRequest(`/videos/${videoId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ text, timestamp })
  });
}

export async function deleteVideoNote(videoId, noteId) {
  return apiRequest(`/videos/${videoId}/notes/${noteId}`, {
    method: 'DELETE'
  });
}
// ============================================
// USER HISTORY APIs
// ============================================

/**
 * Get user's video history
 * GET /api/history
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - sort: "recent" | "oldest" (default: "recent")
 * 
 * Response:
 * {
 *   "videos": [...],
 *   "total": 45,
 *   "page": 1,
 *   "totalPages": 3
 * }
 */
export async function getVideoHistory(page = 1, limit = 20) {
  return apiRequest(`/history?page=${page}&limit=${limit}`);
}

/**
 * Delete video from history
 * DELETE /api/history/:videoId
 */
export async function deleteFromHistory(videoId) {
  return apiRequest(`/history/${videoId}`, { method: 'DELETE' });
}

/**
 * Clear all history
 * DELETE /api/history
 */
export async function clearHistory() {
  return apiRequest('/history', { method: 'DELETE' });
}

// ============================================
// QUIZ APIs
// ============================================

/**
 * Submit quiz answers
 * POST /api/quiz/submit
 * 
 * Request Body:
 * {
 *   "videoId": "uuid",
 *   "answers": {
 *     "1": 0,  // questionId: selectedAnswerIndex
 *     "2": 2,
 *     ...
 *   },
 *   "timeTaken": 120 // seconds
 * }
 * 
 * Response:
 * {
 *   "score": 8,
 *   "totalQuestions": 10,
 *   "percentage": 80,
 *   "results": [
 *     {
 *       "questionId": 1,
 *       "correct": true,
 *       "selectedAnswer": 0,
 *       "correctAnswer": 0,
 *       "explanation": "..."
 *     }
 *   ]
 * }
 */
export async function submitQuiz(videoId, answers, timeTaken) {
  return apiRequest('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ videoId, answers, timeTaken }),
  });
}

/**
 * Get quiz history for a user
 * GET /api/quiz/history
 * 
 * Response:
 * {
 *   "quizzes": [
 *     {
 *       "id": "uuid",
 *       "videoId": "uuid",
 *       "videoTitle": "...",
 *       "score": 8,
 *       "totalQuestions": 10,
 *       "percentage": 80,
 *       "completedAt": "2026-01-24T..."
 *     }
 *   ]
 * }
 */
export async function getQuizHistory() {
  return apiRequest('/quiz/history');
}

// ============================================
// USER STATS APIs
// ============================================

/**
 * Get user statistics
 * GET /api/stats
 * 
 * Response:
 * {
 *   "videosProcessed": 15,
 *   "quizzesTaken": 12,
 *   "averageScore": 85,
 *   "totalLearningTime": 450, // minutes
 *   "streak": 5, // days
 *   "achievements": [...],
 *   "recentActivity": [...]
 * }
 */
export async function getUserStats() {
  return apiRequest('/stats');
}

/**
 * Update user stats
 * PATCH /api/stats
 * 
 * This is typically called automatically by the backend
 * when user completes activities
 */
export async function updateUserStats(statsUpdate) {
  return apiRequest('/stats', {
    method: 'PATCH',
    body: JSON.stringify(statsUpdate),
  });
}

// ============================================
// FOLDER APIs
// ============================================

export async function getFolders(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest(`/folders${query}`);
}

export async function createFolder(folderData) {
  return apiRequest('/folders', {
    method: 'POST',
    body: JSON.stringify(folderData)
  });
}

export async function updateFolder(folderId, updates) {
  return apiRequest(`/folders/${folderId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export async function deleteFolder(folderId) {
  return apiRequest(`/folders/${folderId}`, {
    method: 'DELETE'
  });
}

export async function getFolderVideos(folderId, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';

  return apiRequest(`/folders/${folderId}/videos${query}`);
}

export async function updateVideo(videoId, updates) {
  return apiRequest(`/videos/${videoId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
}

export default {
  // Auth
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  getCurrentUser,
  updateProfile,
  
  // Videos
  processVideo,
  getProcessingStatus,
  getVideoContent,
  createVideoNote,
  deleteVideoNote,
  
  // History
  getVideoHistory,
  deleteFromHistory,
  clearHistory,
  
  // Quiz
  submitQuiz,
  getQuizHistory,
  
  // Stats
  getUserStats,
  updateUserStats,

    // Folders
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,

  getFolderVideos,
  updateVideo,
};
