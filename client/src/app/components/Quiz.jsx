import { useState } from 'react';
import { Trophy, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { useAuth } from '@/app/context/AuthContext';

export const Quiz = () => {
  const { 
    currentVideo, 
    quizAnswers, 
    quizSubmitted, 
    selectAnswer, 
    submitQuiz, 
    resetQuiz,
    calculateScore 
  } = useApp();
  
  const { user, updateStats } = useAuth();

  if (!currentVideo) return null;

  const score = calculateScore();
  const totalQuestions = currentVideo.quiz.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  const answeredCount = Object.keys(quizAnswers).length;
  const allAnswered = answeredCount === totalQuestions;
  // Allow submitting as long as at least one question has been answered,
  // instead of forcing the learner to answer every single question.
  const canSubmit = answeredCount > 0;

  const handleSubmitQuiz = () => {
    submitQuiz();
    
    // Update user stats when quiz is submitted
    if (user && updateStats) {
      const currentQuizzesTaken = user.stats?.quizzesTaken || 0;
      const currentAvgScore = user.stats?.averageScore || 0;
      
      // Calculate new average score
      const newAvgScore = Math.round(
        (currentAvgScore * currentQuizzesTaken + percentage) / (currentQuizzesTaken + 1)
      );
      
      updateStats({
        quizzesTaken: currentQuizzesTaken + 1,
        averageScore: newAvgScore,
        totalLearningTime: (user.stats?.totalLearningTime || 0) + 15 // Add 15 min per quiz
      });
    }
  };

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreMessage = () => {
    if (percentage >= 80) return 'Excellent work! 🎉';
    if (percentage >= 60) return 'Good effort! 👍';
    return 'Keep practicing! 💪';
  };

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Interactive Quiz
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {totalQuestions} questions • Test your understanding
            </p>
          </div>
        </div>

        {quizSubmitted && (
          <button
            onClick={resetQuiz}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake</span>
          </button>
        )}
      </div>

      {/* Score Card - Only show when submitted */}
      {quizSubmitted && (
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Your Score
              </p>
              <p className={`text-4xl font-bold ${getScoreColor()}`}>
                {score}/{totalQuestions}
              </p>
              <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-1">
                {getScoreMessage()}
              </p>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                <Award className="w-10 h-10 text-white" />
              </div>
              <p className={`text-2xl font-bold mt-2 ${getScoreColor()}`}>
                {percentage}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {currentVideo.quiz.map((question, qIndex) => {
          const userAnswer = quizAnswers[question.id];
          const isCorrect = userAnswer === question.correctAnswer;
          const showFeedback = quizSubmitted && userAnswer !== undefined;

          return (
            <div
              key={question.id}
              className={`p-6 rounded-xl border-2 transition-all ${
                showFeedback
                  ? isCorrect
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {qIndex + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {question.question}
                  </h3>
                </div>
                {showFeedback && (
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, oIndex) => {
                  const isSelected = userAnswer === oIndex;
                  const isCorrectOption = oIndex === question.correctAnswer;
                  const showCorrect = quizSubmitted && isCorrectOption;
                  const showIncorrect = quizSubmitted && isSelected && !isCorrect;

                  return (
                    <button
                      key={oIndex}
                      onClick={() => selectAnswer(question.id, oIndex)}
                      disabled={quizSubmitted}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        quizSubmitted
                          ? 'cursor-default'
                          : 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600'
                      } ${
                        showCorrect
                          ? 'border-2 border-green-500 dark:border-green-600 bg-green-100 dark:bg-green-950/40'
                          : showIncorrect
                          ? 'border-2 border-red-500 dark:border-red-600 bg-red-100 dark:bg-red-950/40'
                          : isSelected
                          ? 'border-2 border-indigo-500 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'border-2 border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            showCorrect
                              ? 'border-green-600 dark:border-green-400 bg-green-600 dark:bg-green-400'
                              : showIncorrect
                              ? 'border-red-600 dark:border-red-400 bg-red-600 dark:bg-red-400'
                              : isSelected
                              ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-600 dark:bg-indigo-400'
                              : 'border-neutral-400 dark:border-neutral-600'
                          }`}
                        >
                          {(isSelected || showCorrect) && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span
                          className={`flex-1 ${
                            showCorrect || showIncorrect
                              ? 'font-medium'
                              : isSelected
                              ? 'font-medium text-neutral-900 dark:text-white'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {option}
                        </span>
                        {showCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                        {showIncorrect && (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation - Show after submission */}
              {quizSubmitted && (
                <div className="mt-4 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Explanation:
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!quizSubmitted && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmitQuiz}
            disabled={!canSubmit}
            className={`px-8 py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30 hover:shadow-indigo-500/50'
                : 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
            }`}
          >
            {canSubmit
              ? allAnswered
                ? 'Submit Quiz'
                : `Submit Quiz (${answeredCount}/${totalQuestions} answered)`
              : 'Answer at least one question to submit'}
          </button>
        </div>
      )}
    </div>
  );
};