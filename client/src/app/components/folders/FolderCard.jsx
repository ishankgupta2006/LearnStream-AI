import { Folder, MoreVertical, Pencil, Trash2, Video } from 'lucide-react';
import { ProgressRing } from './ProgressRing';

export const FolderCard = ({
  folder,
  onOpen,
  onRename,
  onDelete
}) => {
  return (
    <div
      onClick={() => onOpen(folder)}
      className="group cursor-pointer rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${folder.color}20` }}
        >
          <Folder className="w-6 h-6" style={{ color: folder.color }} />
        </div>

        <div
          className="relative"
          onClick={(event) => event.stopPropagation()}
        >
          <details>
            <summary className="list-none p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer">
              <MoreVertical className="w-5 h-5" />
            </summary>

            <div className="absolute right-0 top-10 z-20 w-36 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl p-1">
              <button
                type="button"
                onClick={() => onRename(folder)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <Pencil className="w-4 h-4" />
                Rename
              </button>

              <button
                type="button"
                onClick={() => onDelete(folder)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </details>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate">
            {folder.name}
          </h3>

          <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Video className="w-4 h-4" />
            <span>
              {folder.videoCount} video{folder.videoCount !== 1 ? 's' : ''}
            </span>
          </div>

          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {folder.completedCount} completed
          </p>
        </div>

        <ProgressRing progress={folder.progress} color={folder.color} />
      </div>
    </div>
  );
};