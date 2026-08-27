import { useState } from 'react';
import {
  FileText,
  Lightbulb,
  Trophy,
  History as HistoryIcon,
} from 'lucide-react';

import { Summary } from './Summary';
import { KeyPoints } from './KeyPoints';
import { Quiz } from './Quiz';
import { History } from './History';
import { VideoHeader } from './VideoHeader';
import { Footer } from './Footer';

export const LearningDashboard = ({ onBackToFolder }) => {
  const [activeTab, setActiveTab] = useState('summary');

  // Keep all learning sections together here.
  // Key Points is fetched during video processing and displayed
  // by the existing KeyPoints component.
  const tabs = [
    {
      id: 'summary',
      label: 'Summary',
      icon: FileText,
    },
    {
      id: 'keypoints',
      label: 'Key Points',
      icon: Lightbulb,
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: Trophy,
    },
    {
      id: 'history',
      label: 'History',
      icon: HistoryIcon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <VideoHeader onBackToFolder={onBackToFolder} />

      <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Learning section navigation */}
        <div className="mb-8">
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-label={`Open ${tab.label}`}
                    aria-selected={isActive}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Learning content */}
        <div className="animate-fade-in">
          {activeTab === 'summary' && <Summary />}

          {activeTab === 'keypoints' && <KeyPoints />}

          {activeTab === 'quiz' && <Quiz />}

          {activeTab === 'history' && <History />}
        </div>
      </div>

      <Footer />
    </div>
  );
};
