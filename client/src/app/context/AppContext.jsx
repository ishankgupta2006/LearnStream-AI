import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const extractVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const AppProvider = ({ children }) => {
  const { isAuthenticated, updateStats } = useAuth();
  
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'processing', 'learning'
 const [currentView, setCurrentView] = useState('folders');

  const [currentVideo, setCurrentVideo] = useState(null);
  const [history, setHistory] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Processing state
  const [processingJobId, setProcessingJobId] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(null);
  const [processingSteps, setProcessingSteps] = useState([]);
  const [processingError, setProcessingError] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null);

  // Remembers which folder (if any) the in-progress video was added from,
  // so that when processing finishes we can return the user straight to
  // that folder's video player instead of the full-page Learning Dashboard.
  // Uses a ref (not state) because pollProcessingStatus is a stable
  // useCallback and would otherwise close over a stale value.
  const processingFolderIdRef = useRef(null);
  // One-shot signal for "a video was just added and finished processing
  // from inside this folder - auto-open it". This is deliberately SEPARATE
  // from currentVideo, which gets updated every time ANY video is viewed
  // (including just re-opening an old one) - reusing currentVideo for this
  // caused the folder page to keep re-opening whatever was last viewed
  // every time you navigated back into that folder.
  const [justAddedVideo, setJustAddedVideo] = useState(null);
  const clearJustAddedVideo = () => setJustAddedVideo(null);

  // Load dark mode preference on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Load history from API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [isAuthenticated]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Load video history from API
  const loadHistory = async () => {
    try {
      const response = await api.getVideoHistory();
      if (response.videos) {
        setHistory(response.videos);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // Poll for processing status
  const pollProcessingStatus = useCallback(async (jobId) => {
    try {
      const status = await api.getProcessingStatus(jobId);
      
      setProcessingProgress(status.progress || 0);
      setProcessingStep(status.currentStep);
      setProcessingSteps(status.steps || []);
      
      if (status.status === 'completed' && status.videoId) {
        // Processing complete - fetch the video content
        const video = await api.getVideoContent(status.videoId);
        setCurrentVideo(video);
        setProcessingJobId(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizStartTime(Date.now());

        if (processingFolderIdRef.current) {
          // Video was added from inside a folder - go back to that
          // folder's page and auto-open it in the "Now Learning" player
          // instead of taking over the whole screen with the Learning
          // Dashboard.
          setJustAddedVideo(video);
          setCurrentStep('input');
        } else {
          setCurrentStep('learning');
        }
        processingFolderIdRef.current = null;
        
        // Refresh history
        loadHistory();
        return true; // Done polling
      } else if (status.status === 'failed') {
        setProcessingError(status.error || 'Processing failed');
        setProcessingJobId(null);
        processingFolderIdRef.current = null;
        setCurrentStep('input');
        return true; // Done polling
      }
      
      return false; // Continue polling
    } catch (err) {
      console.error('Polling error:', err);
      setProcessingError(err.message || 'Failed to get processing status');
      return true; // Stop polling on error
    }
  }, []);

  // Start polling when we have a job ID
  useEffect(() => {
    if (!processingJobId) return;
    
    let isCancelled = false;
    
    const poll = async () => {
      while (!isCancelled) {
        const done = await pollProcessingStatus(processingJobId);
        if (done || isCancelled) break;
        
        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };
    
    poll();
    
    return () => {
      isCancelled = true;
    };
  }, [processingJobId, pollProcessingStatus]);

 const processVideo = async (
  videoUrl,
  videoTitle = '',
  folderId = null
) => {
    setProcessingError(null);
    setProcessingProgress(0);
    setProcessingStep(null);
    setProcessingSteps([]);
    setCurrentStep('processing');
    processingFolderIdRef.current = folderId || null;
    
    try {
      const response = await api.processVideo(videoUrl, videoTitle, folderId);
      
      if (response.status === 'already-processed' && response.videoId) {
        // Video already processed, just load it
        const video = await api.getVideoContent(response.videoId);
        setCurrentVideo(video);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizStartTime(Date.now());
        // If this was triggered from inside a folder, stay there and
        // auto-open it instead of jumping to the full-page Learning Dashboard.
        if (folderId) {
          setJustAddedVideo(video);
        }
        setCurrentStep(folderId ? 'input' : 'learning');
        processingFolderIdRef.current = null;
      } else if (response.jobId) {
        // Start polling for status
        setProcessingJobId(response.jobId);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Process video error:', err);
      setProcessingError(err.message || 'Failed to process video');
      processingFolderIdRef.current = null;
      setCurrentStep('input');
    }
  };
    const openVideoInFolder = async (videoId) => {
    const video = await api.getVideoContent(videoId);

    setCurrentVideo(video);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizStartTime(Date.now());

    return video;
  };

  const loadFromHistory = async (video) => {
    try {
      // Load full video content from API
      const fullVideo = await api.getVideoContent(video.id);
      setCurrentVideo(fullVideo);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizStartTime(Date.now());
      setCurrentStep('learning');
      setCurrentView('dashboard'); // Switch to dashboard to show the learning content
    } catch (err) {
      console.error('Failed to load video:', err);
      // Fallback to the history item data
      setCurrentVideo(video);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setCurrentStep('learning');
      setCurrentView('dashboard'); // Switch to dashboard to show the learning content
    }
  };

  const deleteFromHistory = async (videoId) => {
    try {
      await api.deleteFromHistory(videoId);
      setHistory(prev => prev.filter(v => v.id !== videoId));
    } catch (err) {
      console.error('Failed to delete from history:', err);
    }
  };

  const clearHistory = async () => {
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const resetToInput = () => {
    setCurrentStep('input');
    setCurrentVideo(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setProcessingError(null);
    setProcessingJobId(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const selectAnswer = (questionId, answerIndex) => {
    if (!quizSubmitted) {
      setQuizAnswers(prev => ({
        ...prev,
        [questionId]: answerIndex
      }));
    }
  };

  const submitQuiz = async () => {
    if (!currentVideo) return;
    
    setQuizSubmitted(true);
    
    // Calculate time taken
    const timeTaken = quizStartTime ? Math.round((Date.now() - quizStartTime) / 1000) : 0;
    
    try {
      const response = await api.submitQuiz(currentVideo.id, quizAnswers, timeTaken);
      
      if (response.success && response.statsUpdate) {
        // Update user stats with server response
        updateStats(response.statsUpdate);
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      // Quiz is still marked as submitted locally
    }
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizStartTime(Date.now());
  };

  const calculateScore = () => {
    if (!currentVideo) return 0;
    let correct = 0;
    currentVideo.quiz.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <AppContext.Provider
      value={{
        currentStep,
        currentView,
        setCurrentView,
        currentVideo,
        setCurrentVideo,
        justAddedVideo,
        clearJustAddedVideo,
        history,
        quizAnswers,
        quizSubmitted,
        darkMode,
        processingProgress,
        processingStep,
        processingSteps,
        processingError,
        processVideo,
        openVideoInFolder,
        loadFromHistory,
        deleteFromHistory,

        clearHistory,
        resetToInput,
        toggleDarkMode,
        selectAnswer,
        submitQuiz,
        resetQuiz,
        calculateScore,
        loadHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};