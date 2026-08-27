import { useEffect, useState } from 'react';
import { FolderPlus, X } from 'lucide-react';

const FOLDER_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#0ea5e9'
];

export const AddFolderDialog = ({
  isOpen,
  onClose,
  onSubmit,
  editingFolder = null,
  isSaving = false
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(editingFolder?.name || '');
      setColor(editingFolder?.color || FOLDER_COLORS[0]);
      setError('');
    }
  }, [isOpen, editingFolder]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Please enter a folder name.');
      return;
    }

    try {
      setError('');
      await onSubmit({
        name: name.trim(),
        color
      });
    } catch (err) {
      setError(err.message || 'Unable to save folder.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <FolderPlus className="w-5 h-5" style={{ color }} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {editingFolder ? 'Rename Folder' : 'Create Folder'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Organize your learning videos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Folder name
          </label>

          <input
            autoFocus
            type="text"
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: JavaScript"
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-5 mb-3">
            Folder colour
          </p>

          <div className="flex gap-3">
            {FOLDER_COLORS.map((itemColor) => (
              <button
                key={itemColor}
                type="button"
                onClick={() => setColor(itemColor)}
                className={`w-9 h-9 rounded-full border-4 transition-transform ${
                  color === itemColor
                    ? 'border-neutral-900 dark:border-white scale-110'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: itemColor }}
                aria-label={`Choose ${itemColor}`}
              />
            ))}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-7">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold"
            >
              {isSaving
                ? 'Saving...'
                : editingFolder
                  ? 'Save Changes'
                  : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};