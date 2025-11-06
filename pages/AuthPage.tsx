import React, { useState, useEffect, useContext } from 'react';
import { useUser } from '../UserContext';
import { AppViewContext } from '../App';
import { View } from '../types';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, authenticated } = useUser();
  const { setView } = useContext(AppViewContext)!;

  useEffect(() => {
    if (authenticated) {
      setView(View.Home); // Redirect to home if already authenticated
    }
  }, [authenticated, setView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        alert('Login successful!');
        setView(View.Home);
      } else {
        await register(email, password);
        alert('Registration successful! Please check your email to confirm your account.');
        setIsLogin(true); // Switch to login after registration
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="bg-card border border-border rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-card-foreground mb-8">
          {isLogin ? 'Welcome Back' : 'Join Strat AI'}
        </h2>

        {error && (
          <div className="bg-red-600/20 text-red-400 p-3 rounded-md mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-foreground/80 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-foreground/80 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"
              placeholder="********"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground/50 transition-colors"
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p className="mt-8 text-center text-secondary-foreground/70">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;