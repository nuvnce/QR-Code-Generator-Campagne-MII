// src/pages/MII.jsx
// Format code MII : (21) 25181XXYYNNNNNNNNN
//   XX = 2 lettres région | YY = 2 lettres district | NNNNNNNN = 8 chiffres séquentiel
import { useState } from 'react';
import api from '../lib/api';
import districts from '../lib/districts.json';
import { generateMIIPDF, exportExcel } from '../lib/pdfGenerator';
import { Shield, Download, FileSpreadsheet, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';

const ANNEE_DEFAUT      = new Date().getFullYear();
const GS1_AI            = '(21)';
const PREFIXE_FABRICANT = '25181';

// 2 lettres district : initiales si 2 mots, sinon 2 premiers chars
function getLettresDistrict(nomDistrict) {
  const mots = nomDistrict.trim().split(/\s+/);
  if (mots.length >= 2) return (mots[0][0] + mots[1][0]).toUpperCase();
  return nomDistrict.slice(0, 2).toUpperCase();
}

export default function MII() {
  const regions = Object.keys(districts);

  const [form, setForm] = useState({
    region: '', district: '', annee: ANNEE_DEFAUT, nb_codes: 500
  });
  const [result,   setResult]   = useState(null);
  const [progress, setProgress] = useState(0);
  const [status,   setStatus]   = useState('idle');
  const [errMsg,   setErrMsg]   = useState('');

  const districtsList = form.region
    ? Object.keys(districts[form.region].districts)
    : [];

  const handleRegion = e => setForm(f => ({ ...f, region: e.target.value, district: '' }));

  const lettresRegion   = form.region   ? districts[form.region].lettres : '??';
  const lettresDistrict = form.district ? getLettresDistrict(form.district) : '??';
  const segmentGeo      = `${lettresRegion}${lettresDistrict}`;
  const exempleCode     = `${GS1_AI} ${PREFIXE_FABRICANT}${segmentGeo}00000001`;

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus('loading');
    setProgress(0);
    setErrMsg('');
    setResult(null);

    try {
      const { data } = await api.post('/generate/mii', {
        region:           form.region,
        district:         form.district,
        lettres_region:   lettresRegion,
        lettres_district: lettresDistrict,
        annee:            form.annee,
        nb_codes:         +form.nb_codes,
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
    const BATCH = 80;
    let done = 0;
    const interval = setInterval(() => {
      done = Math.min(done + BATCH, total);
      setProgress(Math.round((done / total) * 100));
      if (done >= total) clearInterval(interval);
    }, 70);

    await generateMIIPDF({
      codes:    result.codes,
      region:   form.region,
      district: form.district,
      segment:  result.segment,
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
      type:     'mii',
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
          <Shield size={24} className="text-[#3b82f6]" /> Codes MII
        </h1>
        <p className="text-[#8ba3be] text-sm mt-1">
          Génère les QR codes des moustiquaires imprégnées d'insecticide (format GS1).
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
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3b82f6] appearance-none transition-colors"
              >
                <option value="">— Sélectionner une région —</option>
                {regions.map(r => (
                  <option key={r} value={r}>
                    {r}  [{districts[r].lettres}]
                  </option>
                ))}
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
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3b82f6] appearance-none transition-colors disabled:opacity-40"
              >
                <option value="">— Sélectionner un district —</option>
                {districtsList.map(d => (
                  <option key={d} value={d}>
                    {d}  [{getLettresDistrict(d)}]
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a7c] pointer-events-none" />
            </div>
          </div>

          {/* Aperçu code */}
          {form.district && (
            <div className="bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-3 space-y-2">
              <p className="text-[#8ba3be] text-xs font-medium">Exemple de code généré :</p>
              <p className="text-[#3b82f6] font-mono text-sm">{exempleCode}</p>
              <div className="flex flex-wrap gap-3 text-xs text-[#8ba3be] pt-0.5">
                <span><span className="text-white font-medium">(21)</span> = AI GS1</span>
                <span><span className="text-white font-medium">25181</span> = Fabricant</span>
                <span><span className="text-[#00c28e] font-medium">{lettresRegion}</span> = {form.region}</span>
                <span><span className="text-[#f59e0b] font-medium">{lettresDistrict}</span> = {form.district}</span>
              </div>
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
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div>
              <label className="block text-[#8ba3be] text-xs font-medium mb-1.5">
                Nombre de codes MII
              </label>
              <input
                type="number" min="1" max="100000"
                value={form.nb_codes}
                onChange={e => setForm(f => ({ ...f, nb_codes: +e.target.value }))}
                className="w-full bg-[#07131f] border border-[#1a3a5c] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || status === 'pdf'}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {status === 'loading'
              ? <><Loader2 size={18} className="animate-spin" /> Génération en cours...</>
              : <><Shield size={18} /> Générer les codes MII</>
            }
          </button>
        </form>

        {/* Progression */}
        {(status === 'loading' || status === 'pdf') && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-[#8ba3be] mb-1.5">
              <span>{status === 'pdf' ? 'Génération du PDF...' : 'Génération des codes...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-[#07131f] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Résultat */}
        {status === 'done' && result && (
          <div className="mt-5 space-y-3">
            <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#3b82f6] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">
                  {result.nb_codes?.toLocaleString('fr-FR')} codes — {form.district} — Vague {result.vague}
                </p>
                <p className="text-[#8ba3be] text-xs mt-1.5 font-mono truncate">{result.exemple}</p>
                <p className="text-[#8ba3be] text-xs font-mono">…</p>
                <p className="text-[#8ba3be] text-xs font-mono truncate">{result.dernier}</p>
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

        {status === 'error' && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {errMsg}
          </div>
        )}
      </div>
    </div>
  );
}
