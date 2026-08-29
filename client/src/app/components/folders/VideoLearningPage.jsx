import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';

import * as api from '../../../services/api';
import { useApp } from '../../context/AppContext';
import { Summary } from '../Summary';
import { KeyPoints } from '../KeyPoints';
import { Quiz } from '../Quiz';

const YOUTUBE_API_ID = 'learnstream-youtube-player-api';

const formatTimestamp = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
};

const loadYouTubePlayerApi = () =>
  new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const existingScript = document.getElementById(YOUTUBE_API_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.YT), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.id = YOUTUBE_API_ID;
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });

export const VideoLearningPage = ({ video, onClose, onVideoUpdated }) => {
  const playerElementRef = useRef(null);
  const playerRef = useRef(null);
  const { setCurrentVideo, resetQuiz } = useApp();

  const [notes, setNotes] = useState(video.notes || []);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [activeSection, setActiveSection] = useState('summary');

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingKeyPoints, setIsGeneratingKeyPoints] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const hasSummary = Boolean(video.summary);
  const hasKeyPoints = Boolean(video.keyPoints?.length);
  const hasQuiz = Boolean(video.quiz?.length);

  useEffect(() => {
    setNotes(video.notes || []);
  }, [video]);

  // Summary/KeyPoints/Quiz read from the global currentVideo in context -
  // keep it in sync with whichever video is open in this player so they
  // always show the right content (and pick up newly-generated fields).
  useEffect(() => {
    setCurrentVideo(video);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video]);

  const applyVideoUpdate = (updates) => {
    const updatedVideo = { ...video, ...updates };
    setCurrentVideo(updatedVideo);
    onVideoUpdated?.(updatedVideo);
  };

  const handleGenerateSummary = async () => {
    setGenerationError('');
    setIsGeneratingSummary(true);
    try {
      const response = await api.generateSummary(video.id);
      applyVideoUpdate({ summary: response.summary });
    } catch (error) {
      setGenerationError(error.message || 'Could not generate the summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateKeyPoints = async () => {
    setGenerationError('');
    setIsGeneratingKeyPoints(true);
    try {
      const response = await api.generateKeyPoints(video.id);
      applyVideoUpdate({ keyPoints: response.keyPoints });
    } catch (error) {
      setGenerationError(error.message || 'Could not generate key points.');
    } finally {
      setIsGeneratingKeyPoints(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGenerationError('');
    setIsGeneratingQuiz(true);
    try {
      const response = await api.generateQuiz(video.id);
      resetQuiz();
      applyVideoUpdate({ quiz: response.quiz, keyPoints: response.keyPoints || video.keyPoints });
    } catch (error) {
      setGenerationError(error.message || 'Could not generate the quiz.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const createPlayer = async () => {
      const YT = await loadYouTubePlayerApi();

      if (isCancelled || !playerElementRef.current) return;

      playerRef.current = new YT.Player(playerElementRef.current, {
        videoId: video.videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1
        }
      });
    };

    createPlayer();

    return () => {
      isCancelled = true;

      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }

      playerRef.current = null;
    };
  }, [video.id, video.videoId]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      setNoteError('Write a note before saving.');
      return;
    }

    const currentTimestamp = playerRef.current?.getCurrentTime?.() || 0;

    try {
      setIsSavingNote(true);
      setNoteError('');

      const response = await api.createVideoNote(
        video.id,
        noteText.trim(),
        currentTimestamp
      );

      const updatedNotes = [...notes, response.note];
      setNotes(updatedNotes);
      setNoteText('');
      // Keep the parent's video object (and AppContext's currentVideo) in
      // sync with the latest notes - otherwise a later Generate action
      // would merge against the stale `video` prop and wipe these out.
      applyVideoUpdate({ notes: updatedNotes });
    } catch (error) {
      setNoteError(error.message || 'Could not save the note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteVideoNote(video.id, noteId);

      const updatedNotes = notes.filter((note) => (note._id || note.id) !== noteId);
      setNotes(updatedNotes);
      applyVideoUpdate({ notes: updatedNotes });
    } catch (error) {
      setNoteError(error.message || 'Could not delete the note.');
    }
  };

  const seekToNote = (timestamp) => {
    if (!playerRef.current?.seekTo) return;

    playerRef.current.seekTo(timestamp, true);
    playerRef.current.playVideo?.();
  };

  return (
    <section className="mt-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            NOW LEARNING
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {video.displayTitle || video.videoTitle}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
          Close Player
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-black shadow-xl">
          <div className="aspect-video">
            <div ref={playerElementRef} className="w-full h-full" />
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-lg">
          <div className="flex items-center gap-3 p-5 border-b border-neutral-200 dark:border-neutral-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">
                My Notes
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Notes are saved with the video time.
              </p>
            </div>
          </div>

          <div className="p-5">
            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Write an important idea from this video..."
              rows={4}
              className="w-full resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {noteError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {noteError}
              </p>
            )}

            <button
              type="button"
              onClick={handleSaveNote}
              disabled={isSavingNote}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              <MessageSquarePlus className="w-4 h-4" />
              {isSavingNote ? 'Saving note...' : 'Add note at current time'}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto border-t border-neutral-200 dark:border-neutral-800">
            {notes.length === 0 ? (
              <p className="p-5 text-sm text-neutral-500 dark:text-neutral-400">
                No notes yet. Play the video and save your first timestamped note.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {notes.map((note) => {
                  const noteId = note._id || note.id;

                  return (
                    <li key={noteId} className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => seekToNote(note.timestamp)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                          title="Jump to this time"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimestamp(note.timestamp)}
                        </button>

                        <p className="flex-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                          {note.text}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleDeleteNote(noteId)}
                          className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mt-10">
        <button
          type="button"
          onClick={() => setActiveSection('summary')}
          className={`text-left p-6 rounded-2xl border transition-all ${
            activeSection === 'summary'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            {hasSummary && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
          <h3 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
            Video Summary
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {hasSummary
              ? 'Review the AI-generated explanation and key concepts.'
              : 'Not generated yet - click to generate.'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('keypoints')}
          className={`text-left p-6 rounded-2xl border transition-all ${
            activeSection === 'keypoints'
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-lg shadow-amber-500/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <ListChecks className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            {hasKeyPoints && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
          <h3 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
            Key Points
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {hasKeyPoints
              ? 'The main takeaways from this video, broken down.'
              : 'Not generated yet - click to generate.'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('quiz')}
          className={`text-left p-6 rounded-2xl border transition-all ${
            activeSection === 'quiz'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg shadow-purple-500/10'
              : 'border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            {hasQuiz && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
          <h3 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
            Quiz
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {hasQuiz
              ? 'Test what you understood with the AI quiz.'
              : 'Not generated yet - click to generate.'}
          </p>
        </button>
      </div>

      {generationError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {generationError}
        </p>
      )}

      <div className="mt-6">
        {activeSection === 'summary' &&
          (hasSummary ? (
            <Summary />
          ) : (
            <GeneratePrompt
              icon={FileText}
              title="Generate the video summary"
              description="Have AI read through the video's content and write a clear, detailed summary you can study from."
              isGenerating={isGeneratingSummary}
              onGenerate={handleGenerateSummary}
            />
          ))}

        {activeSection === 'keypoints' &&
          (hasKeyPoints ? (
            <KeyPoints />
          ) : (
            <GeneratePrompt
              icon={ListChecks}
              title="Generate key points"
              description="Have AI pull out the main takeaways from this video as a clear, numbered list."
              isGenerating={isGeneratingKeyPoints}
              onGenerate={handleGenerateKeyPoints}
            />
          ))}

        {activeSection === 'quiz' &&
          (hasQuiz ? (
            <Quiz />
          ) : (
            <GeneratePrompt
              icon={Sparkles}
              title="Generate a quiz"
              description="Have AI create a 10-question quiz based on this video so you can test what you've learned."
              isGenerating={isGeneratingQuiz}
              onGenerate={handleGenerateQuiz}
            />
          ))}
      </div>
    </section>
  );
};

const GeneratePrompt = ({ icon: Icon, title, description, isGenerating, onGenerate }) => (
  <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-10 text-center">
    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
      <Icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
    </div>
    <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
      {description}
    </p>
    <button
      type="button"
      onClick={onGenerate}
      disabled={isGenerating}
      className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Generate
        </>
      )}
    </button>
  </div>
);