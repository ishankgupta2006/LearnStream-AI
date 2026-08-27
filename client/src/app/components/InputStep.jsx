import { useState } from 'react';
import { Youtube, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { WelcomeModal } from './WelcomeModal';
import { Footer } from './Footer';

export const InputStep = () => {
  const { processVideo } = useApp();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      processVideo(url.trim(), title.trim() || 'Educational Video');
      setUrl('');
      setTitle('');
    }
  };

  const handleExample = () => {
    const exampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const exampleTitle = 'Advanced Machine Learning Fundamentals';
    setUrl(exampleUrl);
    setTitle(exampleTitle);
  };

  return (
    <>
      <WelcomeModal />
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-2xl w-full">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 mb-6">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  AI-Powered Learning
                </span>
              </div>
              
              <h1 className="text-5xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
                Transform YouTube Videos
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Into Structured Learning
                </span>
              </h1>
              
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
                Paste any educational video URL and let our AI generate summaries, key insights, and interactive quizzes
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-950/50 border border-neutral-200 dark:border-neutral-800 p-8">
                <div className="space-y-4">
                  {/* YouTube URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      YouTube Video URL *
                    </label>
                    <div className="relative">
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Video Title Input (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Video Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Introduction to React Hooks"
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Generate Learning Content</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Example Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleExample}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Try with example video
                </button>
              </div>
            </form>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              {[
                { label: 'AI Summary', icon: '📝' },
                { label: 'Key Points', icon: '💡' },
                { label: '10-Q Quiz', icon: '🎯' },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="text-center p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {feature.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};