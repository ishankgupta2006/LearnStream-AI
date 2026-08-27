import { useEffect, useState } from 'react';
import { FolderPlus, Search, FolderOpen, RefreshCw } from 'lucide-react';
import * as api from '../../../services/api';
import { AddFolderDialog } from './AddFolderDialog';
import { FolderCard } from './FolderCard';

export const FoldersDashboard = ({ onOpenFolder }) => {
  const [folders, setFolders] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);

  const loadFolders = async (searchValue = '') => {
    try {
      setIsLoading(true);
      setError('');

      const response = await api.getFolders(searchValue);
      setFolders(response.folders || []);
    } catch (err) {
      setError(err.message || 'Could not load folders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFolders(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleCreateOrUpdate = async (folderData) => {
    try {
      setIsSaving(true);

      if (editingFolder) {
        await api.updateFolder(editingFolder.id, folderData);
      } else {
        await api.createFolder(folderData);
      }

      setIsDialogOpen(false);
      setEditingFolder(null);
      await loadFolders(search);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (folder) => {
    const shouldDelete = window.confirm(
      `Delete "${folder.name}"?\n\nYour videos will stay safe in Unfiled videos.`
    );

    if (!shouldDelete) return;

    try {
      await api.deleteFolder(folder.id);
      await loadFolders(search);
    } catch (err) {
      setError(err.message || 'Could not delete folder.');
    }
  };

  const handleOpenFolder = (folder) => {
  onOpenFolder(folder);
};

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
              YOUR LEARNING LIBRARY
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
              My Folders
            </h1>

            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Keep your YouTube learning content organised in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingFolder(null);
              setIsDialogOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25"
          >
            <FolderPlus className="w-5 h-5" />
            Add Folder
          </button>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search folders..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadFolders(search)}
              className="inline-flex items-center gap-2 font-semibold text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-neutral-500 dark:text-neutral-400">
            Loading folders...
          </div>
        ) : folders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 py-20 px-6 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              No folders found
            </h2>

            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Create a folder for JavaScript, React, Python, or any topic you are learning.
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingFolder(null);
                setIsDialogOpen(true);
              }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <FolderPlus className="w-5 h-5" />
              Create First Folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={handleOpenFolder}
                onRename={(selectedFolder) => {
                  setEditingFolder(selectedFolder);
                  setIsDialogOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AddFolderDialog
        isOpen={isDialogOpen}
        editingFolder={editingFolder}
        isSaving={isSaving}
        onClose={() => {
          if (!isSaving) {
            setIsDialogOpen(false);
            setEditingFolder(null);
          }
        }}
        onSubmit={handleCreateOrUpdate}
      />
    </main>
  );
};