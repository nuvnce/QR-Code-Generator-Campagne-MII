// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../lib/api';
import { QrCode, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07131f] flex items-center justify-center p-4">
      {/* Déco background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00c28e]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#1a3a5c]/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-[#0d1f35] border border-[#1a3a5c] rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#00c28e] flex items-center justify-center mb-4 shadow-lg shadow-[#00c28e]/30">
              <QrCode size={28} className="text-white" />
            </div>
            <h1 className="text-white font-bold text-xl">QR Generator</h1>
            <p className="text-[#8ba3be] text-sm mt-1">Campagne MII — PNLP Togo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#3a5a7c] focus:outline-none focus:border-[#00c28e] transition-colors"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#3a5a7c] focus:outline-none focus:border-[#00c28e] transition-colors pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a7c] hover:text-[#8ba3be]"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00c28e] hover:bg-[#00a87a] text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#3a5a7c] text-xs mt-6">
          Programme National de Lutte contre le Paludisme — Togo
        </p>
      </div>
    </div>
  );
}
