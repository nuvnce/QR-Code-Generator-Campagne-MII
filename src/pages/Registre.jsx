// src/pages/Registre.jsx
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { BookOpen, Download, Search, Filter } from 'lucide-react';

function Badge({ type }) {
  return type === 'coupon'
    ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00c28e]/10 text-[#00c28e]">Coupon</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#3b82f6]/10 text-[#3b82f6]">MII</span>;
}

export default function Registre() {
  const [data,    setData]    = useState({ coupons: [], mii: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | coupons | mii
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    api.get('/registre').then(r => { setData(r.data); setLoading(false); });
  }, []);

  const rows = [
    ...data.coupons.map(c => ({
      ...c, _type: 'coupon',
      zone: `${c.district} (${c.abrev_district})`,
    })),
    ...data.mii.map(m => ({
      ...m, _type: 'mii',
      zone: m.district ? `${m.district} [${m.segment_geo}]` : m.region,
    })),
  ]
    .sort((a, b) => new Date(b.date_generation) - new Date(a.date_generation))
    .filter(r => filter === 'all' || r._type === filter.slice(0, -1))  // 'coupons' → 'coupon'
    .filter(r => !search || r.zone?.toLowerCase().includes(search.toLowerCase()));

  const handleExport = async () => {
    const { exportExcel } = await import('../lib/pdfGenerator');
    // Export du registre complet
    const allCodes = rows.map(r => ({
      type:       r._type,
      zone:       r.zone,
      annee:      r.annee,
      vague:      `V${r.vague}`,
      nb_generes: r.nb_generes,
      id_debut:   r.id_debut,
      id_fin:     r.id_fin,
      agent:      r.agent_nom,
      date:       new Date(r.date_generation).toLocaleDateString('fr-FR'),
    }));

    // Export manuel via ExcelJS
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Registre');
    ws.columns = [
      { header: 'Type',          key: 'type',       width: 10 },
      { header: 'Zone',          key: 'zone',       width: 25 },
      { header: 'Année',         key: 'annee',      width: 8  },
      { header: 'Vague',         key: 'vague',      width: 8  },
      { header: 'Nb générés',    key: 'nb_generes', width: 12 },
      { header: 'ID début',      key: 'id_debut',   width: 10 },
      { header: 'ID fin',        key: 'id_fin',     width: 10 },
      { header: 'Agent',         key: 'agent',      width: 20 },
      { header: 'Date',          key: 'date',       width: 15 },
    ];
    ws.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a5c' } };
    });
    allCodes.forEach(r => ws.addRow(r));

    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `registre_complet_${new Date().toISOString().slice(0,10)}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-[#f59e0b]" /> Registre
          </h1>
          <p className="text-[#8ba3be] text-sm mt-1">Historique complet des générations</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#1a3a5c] hover:bg-[#1e4570] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Download size={15} /> Exporter Excel
        </button>
      </div>

      {/* Stats résumé */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total coupons', value: data.stats?.total_coupons, color: '#00c28e' },
          { label: 'Total MII',     value: data.stats?.total_mii,     color: '#3b82f6' },
          { label: 'Total général', value: (+data.stats?.total_coupons||0) + (+data.stats?.total_mii||0), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1f35] border border-[#1a3a5c] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {(+s.value || 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-[#8ba3be] text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5a7c]" />
          <input
            type="text"
            placeholder="Rechercher par zone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0d1f35] border border-[#1a3a5c] rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#00c28e]"
          />
        </div>
        {['all', 'coupons', 'mii'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-[#1a3a5c] text-white' : 'text-[#8ba3be] hover:text-white'
            }`}
          >
            {f === 'all' ? 'Tout' : f === 'coupons' ? 'Coupons' : 'MII'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d1f35] border border-[#1a3a5c] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a3a5c]">
                {['Type','Zone','Année','Vague','Générés','ID début','ID fin','Agent','Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#8ba3be] text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-[#8ba3be] py-8 text-sm">Chargement...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-[#8ba3be] py-8 text-sm">Aucune donnée</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-b border-[#1a3a5c] last:border-0 hover:bg-[#1a3a5c]/20">
                  <td className="px-4 py-3"><Badge type={r._type} /></td>
                  <td className="px-4 py-3 text-white text-sm">{r.zone}</td>
                  <td className="px-4 py-3 text-[#8ba3be] text-sm">{r.annee}</td>
                  <td className="px-4 py-3 text-[#8ba3be] text-sm">V{r.vague}</td>
                  <td className="px-4 py-3 text-white text-sm font-medium">{r.nb_generes?.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-[#8ba3be] text-sm font-mono">{r.id_debut}</td>
                  <td className="px-4 py-3 text-[#8ba3be] text-sm font-mono">{r.id_fin}</td>
                  <td className="px-4 py-3 text-[#8ba3be] text-sm">{r.agent_nom}</td>
                  <td className="px-4 py-3 text-[#8ba3be] text-sm">{new Date(r.date_generation).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
