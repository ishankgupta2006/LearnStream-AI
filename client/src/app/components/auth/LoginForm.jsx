import { useState } from 'react';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export const LoginForm = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@learnstream.ai');
    setPassword('demo123');
    setIsLoading(true);
    setError('');
    
    try {
      // Try to login first, if fails try to register demo account
      const loginResult = await login('demo@learnstream.ai', 'demo123');
      if (!loginResult.success) {
        setError('Demo login failed. Backend may not be running.');
      }
    } catch (err) {
      setError('Demo login failed. Please ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
          <Sparkles className="w-4 h-4" style={{ color: '#4f46e5' }} />
          <span className="text-sm font-medium" style={{ color: '#4f46e5' }}>
            Welcome Back
          </span>
        </div>
        
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#171717' }}>
          Sign In
        </h1>
        <p style={{ color: '#525252' }}>
          Continue your learning journey
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl shadow-xl p-8 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800">
          {error && (
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#404040' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a3a3a3' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #d4d4d4',
                    color: '#171717',
                    '--tw-ring-color': '#6366f1'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#404040' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#a3a3a3' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #d4d4d4',
                    color: '#171717'
                  }}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full text-white font-semibold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            style={{ 
              background: isLoading ? '#a3a3a3' : 'linear-gradient(to right, #4f46e5, #7c3aed)',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
            }}
          >
            {isLoading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="text-sm font-medium hover:underline"
            style={{ color: '#4f46e5' }}
          >
            Try with demo account
          </button>
          
          <p className="text-sm" style={{ color: '#525252' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium hover:underline"
              style={{ color: '#4f46e5' }}
            >
              Sign up
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
