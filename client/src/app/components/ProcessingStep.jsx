import { useState, useEffect } from 'react';
import { Sparkles, Brain, FileText, Lightbulb, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

const processingStepsList = [
  { id: 'fetching', label: 'Fetching video content', icon: FileText },
  { id: 'transcribing', label: 'Transcribing audio with AI', icon: Brain },
  { id: 'summarizing', label: 'Generating comprehensive summary', icon: FileText },
  { id: 'extracting', label: 'Extracting key learning points', icon: Lightbulb },
  { id: 'quiz-generation', label: 'Creating interactive quiz', icon: HelpCircle },
];

export const ProcessingStep = () => {
  const { 
    processingProgress, 
    processingStep, 
    processingSteps,
    processingError,
    resetToInput 
  } = useApp();

  // Get step status from API response or calculate from current step
  const getStepStatus = (stepId) => {
    // If we have steps from API, use them
    if (processingSteps && processingSteps.length > 0) {
      const step = processingSteps.find(s => s.name === stepId);
      return step?.status || 'pending';
    }
    
    // Otherwise calculate from current step
    const stepIndex = processingStepsList.findIndex(s => s.id === stepId);
    const currentIndex = processingStepsList.findIndex(s => s.id === processingStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'in-progress';
    return 'pending';
  };

  // Show error state
  if (processingError) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            Processing Failed
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {processingError}
          </p>
          <Button onClick={resetToInput} className="gap-2">
            Try Another Video
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
      <div className="max-w-4xl w-full">
        {/* Processing Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-6">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              AI Processing in Progress
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
            Analyzing Your Video
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Our AI is extracting insights and generating your learning materials...
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-950/50 border border-neutral-200 dark:border-neutral-800 p-8 mb-8">
          <div className="space-y-4">
            {processingStepsList.map((step) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'in-progress';

              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : isCurrent 
                        ? 'bg-indigo-50 dark:bg-indigo-950/20' 
                        : 'bg-neutral-50 dark:bg-neutral-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 dark:bg-green-600' 
                      : isCurrent 
                        ? 'bg-indigo-500 dark:bg-indigo-600 animate-pulse' 
                        : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium transition-colors ${
                      isCompleted 
                        ? 'text-green-700 dark:text-green-400' 
                        : isCurrent 
                          ? 'text-indigo-700 dark:text-indigo-400' 
                          : 'text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {isCurrent && (
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  )}
                  {isCompleted && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Complete
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {processingProgress}%
              </span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Skeleton Loaders */}
        <div className="grid gap-6 animate-fade-in">
          {/* Summary Skeleton */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-11/12 animate-pulse"></div>
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-10/12 animate-pulse"></div>
            </div>
          </div>

          {/* Key Points Skeleton */}
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse"></div>
                  <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
