import { useState } from 'react';
import { User, Mail, Calendar, Award, Video, Brain, Clock, Edit2, Save, X, TrendingUp, Play, ExternalLink } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useApp } from '@/app/context/AppContext';
import { Footer } from './Footer';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { history, loadFromHistory } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    updateProfile({ name: name.trim() });
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setName(user.name);
    setIsEditing(false);
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stats = [
    {
      label: 'Videos Processed',
      value: history.length,
      icon: Video,
      color: 'indigo',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950',
      textColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      label: 'Quizzes Taken',
      value: user.stats?.quizzesTaken || 0,
      icon: Brain,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Average Score',
      value: user.stats?.averageScore ? `${user.stats.averageScore}%` : '0%',
      icon: Award,
      color: 'amber',
      bgColor: 'bg-amber-100 dark:bg-amber-950',
      textColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Learning Time',
      value: user.stats?.totalLearningTime ? `${user.stats.totalLearningTime}m` : '0m',
      icon: Clock,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-950',
      textColor: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto px-6 w-full">
        {/* Profile Header */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-xl shadow-indigo-500/30">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-green-500 border-4 border-white dark:border-neutral-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-2xl font-bold px-3 py-1 rounded-lg border-2 border-indigo-500 dark:border-indigo-600 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                    {error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                      {user.name}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                      title="Edit name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Badge */}
            <div className="text-center">
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30">
                <div className="text-sm">Learning Level</div>
                <div className="text-2xl">⭐ Pro</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
            Recent Activity
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 dark:text-neutral-400">
                No videos processed yet. Start learning!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.slice(0, 5).map((video) => (
                <button
                  key={video.id}
                  onClick={() => loadFromHistory(video)}
                  className="w-full flex items-start gap-4 p-4 rounded-xl bg-white/60 dark:bg-neutral-950/60 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer text-left group"
                >
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.videoTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${video.videoId}/default.jpg`;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {video.videoTitle}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(video.processedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      Summary
                    </span>
                    <span className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-950 text-xs font-medium text-purple-700 dark:text-purple-300">
                      Quiz
                    </span>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <Play className="w-4 h-4" />
                      <span className="text-xs font-medium">View</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="mt-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
            Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🎯', title: 'First Video', unlocked: history.length >= 1 },
              { emoji: '🔥', title: '5 Videos', unlocked: history.length >= 5 },
              { emoji: '⭐', title: 'Perfect Score', unlocked: false },
              { emoji: '🏆', title: '10 Quizzes', unlocked: (user.stats?.quizzesTaken || 0) >= 10 }
            ].map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  achievement.unlocked
                    ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.emoji}</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-white">
                  {achievement.title}
                </div>
                {achievement.unlocked && (
                  <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                    Unlocked!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};