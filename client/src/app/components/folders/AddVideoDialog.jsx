import { useState } from 'react';
import { Link, Plus, X } from 'lucide-react';

export const AddVideoDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!videoUrl.trim()) {
      setError('Please paste a YouTube video URL.');
      return;
    }

    setError('');

    await onSubmit({
      videoUrl: videoUrl.trim(),
      videoTitle: videoTitle.trim()
    });

    setVideoUrl('');
    setVideoTitle('');
  };

  const closeDialog = () => {
    if (isSubmitting) return;

    setVideoUrl('');
    setVideoTitle('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={closeDialog}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl p-6">
        <div className="flex justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
              <Plus className="w-5 h-5 text-red-600" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Add YouTube Video
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                AI will create a summary, key points, and quiz.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              YouTube URL *
            </label>

            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />

              <input
                type="url"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Custom title <span className="font-normal">(optional)</span>
            </label>

            <input
              type="text"
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.target.value)}
              placeholder="Example: React Hooks Tutorial"
              maxLength={150}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeDialog}
              className="px-4 py-2.5 rounded-xl font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Starting...' : 'Add and Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};