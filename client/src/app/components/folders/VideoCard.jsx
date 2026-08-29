import {
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Trash2
} from 'lucide-react';

export const VideoCard = ({
  video,
  selected,
  onToggleSelected,
  onOpenLearning,
  onDelete,
  onToggleCompleted
}) => {
  const title = video.displayTitle || video.videoTitle;
  const isCompleted = video.learningStatus === 'completed';
  const hasAnyAiContent = Boolean(
    video.summary || video.keyPoints?.length || video.quiz?.length
  );

  return (
    <article
      onClick={() => onOpenLearning(video)}
      className="group cursor-pointer flex flex-col sm:flex-row gap-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg transition-all"
    >
      <div
        className="pt-1"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelected(video)}
          className="w-5 h-5 accent-indigo-600 cursor-pointer"
          aria-label={`Select ${title}`}
        />
      </div>

      <img
        src={
          video.thumbnail ||
          `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
        }
        alt={title}
        className="w-full sm:w-48 h-28 rounded-xl object-cover bg-neutral-200 dark:bg-neutral-800"
        onError={(event) => {
          event.currentTarget.src =
            `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
        }}
      />

      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2">
          {title}
        </h2>

        {video.channelName && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {video.channelName}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              hasAnyAiContent
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {hasAnyAiContent ? 'AI Learning Content' : 'Ready to generate'}
          </span>

          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
        </div>

        <div
          className="flex flex-wrap gap-2 mt-4"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onOpenLearning(video)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
          >
            <FileText className="w-4 h-4" />
            Open Learning
          </button>

          <a
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="w-4 h-4" />
            YouTube
          </a>

          <button
            type="button"
            onClick={() => onToggleCompleted(video)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </button>

          <button
            type="button"
            onClick={() => onDelete(video)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};