import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  FolderOpen,
  Plus,
  Search,
  Trash2
} from 'lucide-react';

import * as api from '../../../services/api';
import { useApp } from '../../context/AppContext';
import { AddVideoDialog } from './AddVideoDialog';
import { VideoCard } from './VideoCard';
import { VideoLearningPage } from './VideoLearningPage';
export const FolderVideosPage = ({ folder, onBack }) => {
 const {
  processVideo,
  openVideoInFolder,
  deleteFromHistory,
  currentVideo
} = useApp();

  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [error, setError] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  const loadVideos = async (searchValue = '') => {
    try {
      setIsLoading(true);
      setError('');

      const response = await api.getFolderVideos(folder.id, searchValue);
      setVideos(response.videos || []);
    } catch (err) {
      setError(err.message || 'Could not load videos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadVideos(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, folder.id]);

  // When a video finishes processing (started from the "Add Video" dialog
  // in this folder), AppContext hands control back here instead of the
  // full-page Learning Dashboard. Auto-open it in the player and refresh
  // the folder's video list so the new card shows up too.
  useEffect(() => {
    if (currentVideo && String(currentVideo.folderId) === String(folder.id)) {
      setActiveVideo(currentVideo);
      loadVideos(search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideo]);

  const handleAddVideo = async ({ videoUrl, videoTitle }) => {
    try {
      setIsAddingVideo(true);
      setIsAddDialogOpen(false);

      // Existing YouTube + Gemini processing starts here.
      await processVideo(videoUrl, videoTitle, folder.id);
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleDelete = async (video) => {
    const shouldDelete = window.confirm(
      `Delete "${video.displayTitle || video.videoTitle}"?\n\nIts AI summary, key points, and quiz will also be deleted.`
    );

    if (!shouldDelete) return;

    try {
      await deleteFromHistory(video.id);
      setVideos((currentVideos) =>
        currentVideos.filter((item) => item.id !== video.id)
      );
      setSelectedIds((currentIds) =>
        currentIds.filter((id) => id !== video.id)
      );
    } catch (err) {
      setError(err.message || 'Could not delete video.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const shouldDelete = window.confirm(
      `Delete ${selectedIds.length} selected video${selectedIds.length > 1 ? 's' : ''}?\n\nTheir AI summaries, key points, and quizzes will also be deleted. This can't be undone.`
    );

    if (!shouldDelete) return;

    const idsToDelete = [...selectedIds];
    setIsDeletingSelected(true);
    setError('');

    try {
      // Delete one at a time so a single failure doesn't silently drop
      // the rest - whatever succeeds gets removed from the list/selection.
      const failedIds = [];
      for (const id of idsToDelete) {
        try {
          await deleteFromHistory(id);
        } catch (err) {
          failedIds.push(id);
        }
      }

      setVideos((currentVideos) =>
        currentVideos.filter((item) => !idsToDelete.includes(item.id) || failedIds.includes(item.id))
      );
      setSelectedIds(failedIds);

      if (activeVideo && idsToDelete.includes(activeVideo.id) && !failedIds.includes(activeVideo.id)) {
        setActiveVideo(null);
      }

      if (failedIds.length > 0) {
        setError(`Could not delete ${failedIds.length} video${failedIds.length > 1 ? 's' : ''}. Please try again.`);
      }
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleToggleCompleted = async (video) => {
    const nextStatus =
      video.learningStatus === 'completed'
        ? 'in-progress'
        : 'completed';

    try {
      await api.updateVideo(video.id, {
        learningStatus: nextStatus
      });

      setVideos((currentVideos) =>
        currentVideos.map((item) =>
          item.id === video.id
            ? { ...item, learningStatus: nextStatus }
            : item
        )
      );
    } catch (err) {
      setError(err.message || 'Could not update video progress.');
    }
  };

const handleOpenVideo = async (video) => {
  try {
    setError('');

    const fullVideo = await openVideoInFolder(video.id);

    setActiveVideo(fullVideo);
  } catch (err) {
    setError(err.message || 'Could not open this video.');
  }
};

const toggleSelected = (video) => {
  setSelectedIds((currentIds) =>
    currentIds.includes(video.id)
      ? currentIds.filter((id) => id !== video.id)
      : [...currentIds, video.id]
  );
};
  const selectAll = () => {
    if (selectedIds.length === videos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(videos.map((video) => video.id));
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to folders
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mt-5 mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${folder.color}20` }}
            >
              <FolderOpen className="w-7 h-7" style={{ color: folder.color }} />
            </div>

            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                LEARNING FOLDER
              </p>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                {folder.name}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-5 h-5" />
            Add Video
          </button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos in this folder..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {videos.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-indigo-600"
            >
              <CheckSquare className="w-4 h-4" />
              {selectedIds.length === videos.length
                ? 'Clear selection'
                : 'Select all'}
              {selectedIds.length > 0 && ` (${selectedIds.length})`}
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={isDeletingSelected}
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingSelected
                  ? 'Deleting...'
                  : `Delete Selected (${selectedIds.length})`}
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="mb-5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        {activeVideo && (
  <VideoLearningPage
    video={activeVideo}
    onClose={() => {
      setActiveVideo(null);
      setSelectedIds([]);
    }}
  />
)}

        {isLoading ? (
          <div className="py-20 text-center text-neutral-500 dark:text-neutral-400">
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 py-20 px-6 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              No videos in this folder
            </h2>

            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Add a YouTube video and LearnStream AI will create your notes and quiz.
            </p>

            <button
              type="button"
              onClick={() => setIsAddDialogOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add First Video
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                selected={selectedIds.includes(video.id)}
                onToggleSelected={toggleSelected}
                onOpenLearning={handleOpenVideo}
                onDelete={handleDelete}
                onToggleCompleted={handleToggleCompleted}
              />
            ))}
          </div>
        )}
      </div>

      <AddVideoDialog
        isOpen={isAddDialogOpen}
        isSubmitting={isAddingVideo}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddVideo}
      />
    </main>
  );
};