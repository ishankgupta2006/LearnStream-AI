import { useState, useEffect } from 'react';
import { X, Sparkles, Video, Brain, Trophy, ArrowRight } from 'lucide-react';

export const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const steps = [
    {
      icon: Sparkles,
      title: 'Welcome to LearnStream AI! 🎉',
      description: 'Transform any YouTube educational video into structured learning content with the power of AI.',
      color: 'indigo'
    },
    {
      icon: Video,
      title: 'Paste & Process',
      description: 'Simply paste a YouTube URL, and our AI will analyze the video to extract key insights and learning materials.',
      color: 'purple'
    },
    {
      icon: Brain,
      title: 'Learn Smarter',
      description: 'Get AI-generated summaries, key learning points, and comprehensive explanations in seconds.',
      color: 'amber'
    },
    {
      icon: Trophy,
      title: 'Test Your Knowledge',
      description: 'Take interactive quizzes with 10 questions to reinforce what you learned and track your progress.',
      color: 'green'
    }
  ];

  const step = steps[currentStep];
  const Icon = step.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
            step.color === 'indigo' ? 'from-indigo-500 to-purple-600' :
            step.color === 'purple' ? 'from-purple-500 to-pink-600' :
            step.color === 'amber' ? 'from-amber-500 to-orange-600' :
            'from-green-500 to-emerald-600'
          } flex items-center justify-center mx-auto mb-6 shadow-xl ${
            step.color === 'indigo' ? 'shadow-indigo-500/30' :
            step.color === 'purple' ? 'shadow-purple-500/30' :
            step.color === 'amber' ? 'shadow-amber-500/30' :
            'shadow-green-500/30'
          }`}>
            <Icon className="w-10 h-10 text-white" strokeWidth={2} />
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            {step.title}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-indigo-600 dark:bg-indigo-500'
                    : 'w-2 bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2"
            >
              <span>{currentStep < steps.length - 1 ? 'Next' : 'Get Started'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
