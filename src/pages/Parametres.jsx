// src/pages/Parametres.jsx
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Settings, UserPlus, Check, X, Loader2, ShieldCheck, User, Crown } from 'lucide-react';

const ROLE_ICONS = { admin: Crown, superviseur: ShieldCheck, agent: User };
const ROLE_COLORS = { admin: '#f59e0b', superviseur: '#3b82f6', agent: '#00c28e' };

export default function Parametres() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ username:'', nom:'', password:'', role:'agent' });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const load = () => {
    api.get('/users').then(r => { setUsers(r.data); setLoading(false); });
  };
  useEffect(load, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/users', form);
      setSuccess(`Agent "${form.nom}" créé avec succès.`);
      setForm({ username:'', nom:'', password:'', role:'agent' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const toggleActif = async (id, actif) => {
    await api.patch('/users', { id, actif: !actif });
    setUsers(u => u.map(x => x.id === id ? { ...x, actif: !actif } : x));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={24} className="text-[#8b5cf6]" /> Paramètres
        </h1>
        <p className="text-[#8ba3be] text-sm mt-1">Gestion des agents et accès</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Créer un agent */}
        <div className="bg-[#0d1f35] border border-[#1a3a5c] rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-[#00c28e]" /> Nouvel agent
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {[
              { key:'nom',      label:"Nom complet",       type:"text",     placeholder:"Jean Dupont" },
              { key:'username', label:"Nom d'utilisateur", type:"text",     placeholder:"j.dupont" },
              { key:'password', label:"Mot de passe",      type:"password", placeholder:"••••••••" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00c28e]"
                />
              </div>
            ))}

            <div>
              <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">Rôle</label>
              <div className="grid grid-cols-3 gap-2">
                {['agent','superviseur','admin'].map(r => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                      form.role === r
                        ? 'border-[#00c28e] bg-[#00c28e]/10 text-[#00c28e]'
                        : 'border-[#1a3a5c] text-[#8ba3be] hover:border-[#3a5a7c]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {success && <p className="text-[#00c28e] text-xs">{success}</p>}
            {error   && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#00c28e] hover:bg-[#00a87a] text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Créer l'agent
            </button>
          </form>
        </div>

        {/* Liste agents */}
        <div className="bg-[#0d1f35] border border-[#1a3a5c] rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Agents ({users.length})</h2>
          {loading ? (
            <p className="text-[#8ba3be] text-sm text-center py-8">Chargement...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {users.map(u => {
                const Icon  = ROLE_ICONS[u.role] || User;
                const color = ROLE_COLORS[u.role];
                return (
                  <div key={u.id} className="flex items-center justify-between bg-[#07131f] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${color}15` }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{u.nom}</p>
                        <p className="text-[#8ba3be] text-xs">@{u.username} · {u.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActif(u.id, u.actif)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        u.actif
                          ? 'bg-[#00c28e]/10 text-[#00c28e] hover:bg-red-500/10 hover:text-red-400'
                          : 'bg-red-500/10 text-red-400 hover:bg-[#00c28e]/10 hover:text-[#00c28e]'
                      }`}
                    >
                      {u.actif ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
