import { useState } from 'react';
import { FileText, Lightbulb, Trophy, History as HistoryIcon, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../../services/api';
import { Summary } from './Summary';
import { KeyPoints } from './KeyPoints';
import { Quiz } from './Quiz';
import { History } from './History';
import { VideoHeader } from './VideoHeader';
import { Footer } from './Footer';

export const LearningDashboard = ({ onBackToFolder }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const { currentVideo, setCurrentVideo, resetQuiz } = useApp();

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingKeyPoints, setIsGeneratingKeyPoints] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const hasSummary = Boolean(currentVideo?.summary);
  const hasKeyPoints = Boolean(currentVideo?.keyPoints?.length);
  const hasQuiz = Boolean(currentVideo?.quiz?.length);

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'keypoints', label: 'Key Points', icon: Lightbulb },
    { id: 'quiz', label: 'Quiz', icon: Trophy },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  const handleGenerateSummary = async () => {
    if (!currentVideo) return;
    setGenerationError('');
    setIsGeneratingSummary(true);
    try {
      const response = await api.generateSummary(currentVideo.id);
      setCurrentVideo({ ...currentVideo, summary: response.summary });
    } catch (error) {
      setGenerationError(error.message || 'Could not generate the summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateKeyPoints = async () => {
    if (!currentVideo) return;
    setGenerationError('');
    setIsGeneratingKeyPoints(true);
    try {
      const response = await api.generateKeyPoints(currentVideo.id);
      setCurrentVideo({ ...currentVideo, keyPoints: response.keyPoints });
    } catch (error) {
      setGenerationError(error.message || 'Could not generate key points.');
    } finally {
      setIsGeneratingKeyPoints(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!currentVideo) return;
    setGenerationError('');
    setIsGeneratingQuiz(true);
    try {
      const response = await api.generateQuiz(currentVideo.id);
      resetQuiz();
      setCurrentVideo({
        ...currentVideo,
        quiz: response.quiz,
        keyPoints: response.keyPoints || currentVideo.keyPoints
      });
    } catch (error) {
      setGenerationError(error.message || 'Could not generate the quiz.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
   <VideoHeader onBackToFolder={onBackToFolder} />
      
      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {generationError && (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {generationError}
          </p>
        )}

        {/* Content Area */}
        <div className="animate-fade-in">
          {activeTab === 'summary' &&
            (hasSummary ? (
              <Summary />
            ) : (
              <GenerateDashboardPrompt
                icon={FileText}
                title="Generate the video summary"
                description="Have AI read through the video's content and write a clear, detailed summary you can study from."
                isGenerating={isGeneratingSummary}
                onGenerate={handleGenerateSummary}
              />
            ))}
          {activeTab === 'keypoints' &&
            (hasKeyPoints ? (
              <KeyPoints />
            ) : (
              <GenerateDashboardPrompt
                icon={Lightbulb}
                title="Generate key points"
                description="Have AI pull out the main takeaways from this video as a clear, numbered list."
                isGenerating={isGeneratingKeyPoints}
                onGenerate={handleGenerateKeyPoints}
              />
            ))}
          {activeTab === 'quiz' &&
            (hasQuiz ? (
              <Quiz />
            ) : (
              <GenerateDashboardPrompt
                icon={Trophy}
                title="Generate a quiz"
                description="Have AI create a 10-question quiz based on this video so you can test what you've learned."
                isGenerating={isGeneratingQuiz}
                onGenerate={handleGenerateQuiz}
              />
            ))}
          {activeTab === 'history' && <History />}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const GenerateDashboardPrompt = ({ icon: Icon, title, description, isGenerating, onGenerate }) => (
  <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-10 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
      <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
    </div>
    <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
      {description}
    </p>
    <button
      type="button"
      onClick={onGenerate}
      disabled={isGenerating}
      className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Generate
        </>
      )}
    </button>
  </div>
);
