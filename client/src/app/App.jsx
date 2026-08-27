import { useState } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';

import { AuthPage } from './components/auth/AuthPage';
import { Header } from './components/Header';
import { InputStep } from './components/InputStep';
import { ProcessingStep } from './components/ProcessingStep';
import { LearningDashboard } from './components/LearningDashboard';
import { Profile } from './components/Profile';
import { AnimatedBackground } from './components/AnimatedBackground';

import { FoldersDashboard } from './components/folders/FoldersDashboard';
import { FolderVideosPage } from './components/folders/FolderVideosPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

 const {
  currentStep,
  currentView,
  setCurrentView,
  resetToInput
} = useApp();

  // Stores the folder card that the user clicked.
  const [selectedFolder, setSelectedFolder] = useState(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />

        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AnimatedBackground />
        <AuthPage />
      </>
    );
  }

  return (
    <div className="min-h-screen transition-colors relative">
      <AnimatedBackground />

      <Header onNavigate={setCurrentView} />

      <div className="relative z-10">
        {/* Profile page */}
        {currentView === 'profile' ? (
          <Profile />

        /* Existing video-processing page */
        ) : currentStep === 'processing' ? (
          <ProcessingStep />

        /* Existing AI summary / quiz page */
        ) : currentStep === 'learning' ? (
  <LearningDashboard
    onBackToFolder={() => {
      resetToInput();
      setCurrentView('folder-videos');
    }}
  />

        /* Videos inside one selected folder */
        ) : currentView === 'folder-videos' && selectedFolder ? (
          <FolderVideosPage
            folder={selectedFolder}
            onBack={() => {
              setSelectedFolder(null);
              setCurrentView('folders');
            }}
          />

        /* Main folders dashboard */
        ) : currentView === 'folders' ? (
          <FoldersDashboard
            onOpenFolder={(folder) => {
              setSelectedFolder(folder);
              setCurrentView('folder-videos');
            }}
          />

        /* Old YouTube URL input screen, retained safely */
        ) : (
          <InputStep />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}