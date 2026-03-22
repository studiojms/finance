import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <TrendingUp className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Finanças Pro</h1>
          <p className="text-slate-500 max-w-xs">Sua vida financeira organizada em um só lugar.</p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold"
                placeholder="Seu nome"
                required
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold"
              placeholder="exemplo@email.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-bold px-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-50 px-2 text-slate-400 font-bold">Ou continue com</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Entrar com Google
        </button>

        <p className="text-sm text-slate-500">
          {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <button onClick={() => setIsSignUp(!isSignUp)} className="ml-1 text-emerald-600 font-bold hover:underline">
            {isSignUp ? 'Entrar' : 'Cadastre-se'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
