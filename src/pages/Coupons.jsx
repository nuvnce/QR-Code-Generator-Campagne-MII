// src/pages/Coupons.jsx
import { useState } from 'react';
import api from '../lib/api';
import districts from '../lib/districts.json';
import { generateCouponsPDF, exportExcel } from '../lib/pdfGenerator';
import { QrCode, Download, FileSpreadsheet, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';

const ANNEE_DEFAUT = new Date().getFullYear();

export default function Coupons() {
  const regions = Object.keys(districts);

  const [form, setForm] = useState({
    region: '', district: '', annee: ANNEE_DEFAUT, nb_codes: 100
  });
  const [result,   setResult]   = useState(null);
  const [progress, setProgress] = useState(0);
  const [status,   setStatus]   = useState('idle'); // idle | loading | done | error
  const [errMsg,   setErrMsg]   = useState('');

  const districtsList = form.region ? Object.keys(districts[form.region].districts) : [];

  const handleRegion = e => setForm(f => ({ ...f, region: e.target.value, district: '' }));

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus('loading');
    setProgress(0);
    setErrMsg('');
    setResult(null);

    try {
      const info = districts[form.region].districts[form.district];

      // Appel API
      const { data } = await api.post('/generate/coupons', {
        region:   form.region,
        district: form.district,
        abrev:    info.abrev,
        rddd:     info.rddd,
        annee:    form.annee,
        nb_codes: +form.nb_codes,
      });

      setResult(data);
      setProgress(100);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.error || 'Erreur de génération');
    }
  };

  const handlePDF = async () => {
    if (!result) return;
    setStatus('pdf');
    setProgress(0);

    const total = result.codes.length;
    // Simulation progression PDF (génération par lots de 50)
    const BATCH = 50;
    const allCodes = result.codes;
    let done = 0;

    // On génère le PDF complet en passant les codes + callback progression
    const interval = setInterval(() => {
      done = Math.min(done + BATCH, total);
      setProgress(Math.round((done / total) * 100));
      if (done >= total) clearInterval(interval);
    }, 80);

    await generateCouponsPDF({
      codes:    allCodes,
      district: districts[form.region].districts[form.district].abrev,
      vague:    result.vague,
      annee:    form.annee,
    });

    clearInterval(interval);
    setProgress(100);
    setStatus('done');
  };

  const handleExcel = async () => {
    if (!result) return;
    await exportExcel(result.codes, {
      type:     'coupons',
      region:   form.region,
      district: form.district,
      annee:    form.annee,
      vague:    result.vague,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <QrCode size={24} className="text-[#00c28e]" /> Coupons Ménage
        </h1>
        <p className="text-[#8ba3be] text-sm mt-1">
          Génère les QR codes des coupons pour le dénombrement des ménages.
        </p>
      </div>

      <div className="bg-[#0d1f35] border border-[#1a3a5c] rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Région */}
          <div>
            <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">Région</label>
            <div className="relative">
              <select
                value={form.region}
                onChange={handleRegion}
                required
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00c28e] appearance-none transition-colors"
              >
                <option value="">— Sélectionner une région —</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a7c] pointer-events-none" />
            </div>
          </div>

          {/* District */}
          <div>
            <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">District</label>
            <div className="relative">
              <select
                value={form.district}
                onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                required
                disabled={!form.region}
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00c28e] appearance-none transition-colors disabled:opacity-40"
              >
                <option value="">— Sélectionner un district —</option>
                {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a7c] pointer-events-none" />
            </div>
          </div>

          {/* Aperçu code */}
          {form.district && (
            <div className="bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-3">
              <p className="text-[#8ba3be] text-xs mb-1">Exemple de code généré :</p>
              <p className="text-[#00c28e] font-mono text-sm">
                TG-{districts[form.region].districts[form.district].abrev}-{form.annee}-V?-{districts[form.region].districts[form.district].rddd}-000001
              </p>
            </div>
          )}

          {/* Année + Nombre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">Année</label>
              <input
                type="number" min="2020" max="2099"
                value={form.annee}
                onChange={e => setForm(f => ({ ...f, annee: +e.target.value }))}
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00c28e]"
              />
            </div>
            <div>
              <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">
                Nombre de coupons
              </label>
              <input
                type="number" min="1" max="50000"
                value={form.nb_codes}
                onChange={e => setForm(f => ({ ...f, nb_codes: +e.target.value }))}
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00c28e]"
              />
            </div>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={status === 'loading' || status === 'pdf'}
            className="w-full bg-[#00c28e] hover:bg-[#00a87a] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {status === 'loading'
              ? <><Loader2 size={18} className="animate-spin" /> Génération en cours...</>
              : <><QrCode size={18} /> Générer les coupons</>
            }
          </button>
        </form>

        {/* Barre de progression */}
        {(status === 'loading' || status === 'pdf') && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-[#8ba3be] mb-1.5">
              <span>{status === 'pdf' ? 'Génération du PDF...' : 'Génération des codes...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-[#07131f] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00c28e] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Résultat */}
        {status === 'done' && result && (
          <div className="mt-5 space-y-3">
            <div className="bg-[#00c28e]/10 border border-[#00c28e]/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#00c28e] mt-0.5 shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">
                  {result.nb_codes?.toLocaleString('fr-FR')} coupons générés — Vague {result.vague}
                </p>
                <p className="text-[#8ba3be] text-xs mt-1 font-mono">{result.exemple} … </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePDF}
                disabled={status === 'pdf'}
                className="flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#1e4570] text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Download size={16} /> Télécharger PDF
              </button>
              <button
                onClick={handleExcel}
                className="flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#1e4570] text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                <FileSpreadsheet size={16} /> Exporter Excel
              </button>
            </div>
          </div>
        )}

        {/* Erreur */}
        {status === 'error' && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {errMsg}
          </div>
        )}
      </div>
    </div>
  );
}
