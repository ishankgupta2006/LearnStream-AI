import { Youtube, Calendar, ArrowLeft } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

export const VideoHeader = ({ onBackToFolder }) => {
  const { currentVideo } = useApp();

  if (!currentVideo) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="sticky top-[73px] z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Back Button */}
<button
  onClick={onBackToFolder}
  className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-3 transition-colors"
>
  <ArrowLeft className="w-4 h-4" />
  <span>Back to Folder</span>
</button>

        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="hidden sm:block flex-shrink-0">
            <div className="w-32 h-20 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <img
                src={currentVideo.thumbnail}
                alt={currentVideo.videoTitle}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://img.youtube.com/vi/${currentVideo.videoId}/default.jpg`;
                }}
              />
            </div>
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2 truncate">
              {currentVideo.videoTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
              <a
                href={currentVideo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Youtube className="w-4 h-4" />
                <span>Watch on YouTube</span>
              </a>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Processed {formatDate(currentVideo.processedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
