// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../App';
import api from '../lib/api';
import { QrCode, Shield, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-[#0d1f35] border border-[#1a3a5c] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value?.toLocaleString('fr-FR') ?? '—'}</p>
      <p className="text-[#8ba3be] text-sm mt-1">{label}</p>
      {sub && <p className="text-xs mt-2" style={{ color }}>{sub}</p>}
    </div>
  );
}

function RecentRow({ item, type }) {
  const isCP = type === 'coupon';
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1a3a5c] last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isCP ? 'bg-[#00c28e]/10 text-[#00c28e]' : 'bg-[#3b82f6]/10 text-[#3b82f6]'}`}>
          {isCP ? 'CP' : 'M'}
        </div>
        <div>
          <p className="text-white text-sm font-medium">
            {isCP ? `${item.district} — V${item.vague}` : `${item.region} — V${item.vague}`}
          </p>
          <p className="text-[#8ba3be] text-xs">{item.nb_generes?.toLocaleString('fr-FR')} codes • {item.agent_nom}</p>
        </div>
      </div>
      <p className="text-[#8ba3be] text-xs">{new Date(item.date_generation).toLocaleDateString('fr-FR')}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/registre').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const recent = [
    ...(data?.coupons?.slice(0, 3).map(c => ({ ...c, _type: 'coupon' })) || []),
    ...(data?.mii?.slice(0, 3).map(m => ({ ...m, _type: 'mii' })) || []),
  ].sort((a, b) => new Date(b.date_generation) - new Date(a.date_generation)).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-[#8ba3be] text-sm mt-1">
          Bienvenue, <span className="text-[#00c28e]">{user.nom}</span> — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Coupons générés"  value={stats?.total_coupons}       icon={QrCode}     color="#00c28e" sub={`${stats?.nb_vagues_coupons} vagues`} />
        <StatCard label="Codes MII"        value={stats?.total_mii}           icon={Shield}     color="#3b82f6" sub={`${stats?.nb_vagues_mii} vagues`} />
        <StatCard label="Total QR codes"   value={(+stats?.total_coupons||0) + (+stats?.total_mii||0)} icon={TrendingUp} color="#f59e0b" />
        <StatCard label="Dernière activité" value={recent[0] ? new Date(recent[0].date_generation).toLocaleDateString('fr-FR') : 'Aucune'} icon={Clock} color="#8b5cf6" />
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button onClick={() => navigate('/coupons')} className="bg-[#0d1f35] border border-[#1a3a5c] hover:border-[#00c28e] rounded-2xl p-5 text-left transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00c28e]/10 flex items-center justify-center">
                <QrCode size={20} className="text-[#00c28e]" />
              </div>
              <div>
                <p className="text-white font-semibold">Générer Coupons</p>
                <p className="text-[#8ba3be] text-xs">Coupons ménage avec QR</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#3a5a7c] group-hover:text-[#00c28e] transition-colors" />
          </div>
        </button>

        <button onClick={() => navigate('/mii')} className="bg-[#0d1f35] border border-[#1a3a5c] hover:border-[#3b82f6] rounded-2xl p-5 text-left transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center">
                <Shield size={20} className="text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-white font-semibold">Générer Codes MII</p>
                <p className="text-[#8ba3be] text-xs">Moustiquaires imprégnées</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#3a5a7c] group-hover:text-[#3b82f6] transition-colors" />
          </div>
        </button>
      </div>

      {/* Activité récente */}
      <div className="bg-[#0d1f35] border border-[#1a3a5c] rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">Activité récente</h2>
        {loading ? (
          <p className="text-[#8ba3be] text-sm text-center py-6">Chargement...</p>
        ) : recent.length === 0 ? (
          <p className="text-[#8ba3be] text-sm text-center py-6">Aucune génération pour l'instant.</p>
        ) : (
          recent.map((item, i) => <RecentRow key={i} item={item} type={item._type} />)
        )}
      </div>
    </div>
  );
}
