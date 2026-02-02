import { useState, useEffect } from "react";
import { 
  Layout, PageHeader, InputField, SelectField, TextArea, LoadingScreen 
} from "../../components";
import { apiFetch } from "../../utils/api";
import { 
  ShieldCheck, Brain, Dumbbell, FileText, 
  History, Search, CheckCircle, XCircle, AlertTriangle, Activity, Eye, User
} from "lucide-react";

export function MedicalVisits() {
  const [activeTab, setActiveTab] = useState("new");
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Système de notification interne (Remplacement des alert())
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  const initialForm = {
    patient_id: "",
    psychology: {
      past: "", motivation: "", stress_management: "", violence_history: "",
      scenario_response: "", global_opinion: "", note: 0
    },
    physical: {
      arm_strength: false, leg_strength: false, endurance: false,
      sensory_test: false, motor_skills: false,
      bpm_rest: "", bpm_effort: "", ecg_status: "Normal"
    },
    verdict: "Apte",
    global_note: 10
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  // Filtrage dynamique des patients lors de la recherche
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(patients.filter(p => 
        p.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.first_name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  }, [searchTerm, patients]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pRes = await apiFetch("/api/patients");
      if (pRes.ok) {
        const data = await pRes.json();
        const pList = data.patients || [];
        setPatients(pList);
        setFilteredPatients(pList);
      }
      
      const hRes = await apiFetch("/api/medical-visits");
      if (hRes.ok) {
        setHistory(await hRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePsych = (field, value) => {
    setForm(prev => ({ ...prev, psychology: { ...prev.psychology, [field]: value } }));
  };

  const updatePhys = (field, value) => {
    setForm(prev => ({ ...prev, physical: { ...prev.physical, [field]: value } }));
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    // Auto-hide après 3 secondes si c'est un succès
    if (type === "success") {
      setTimeout(() => closeNotification(), 3000);
    }
  };

  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) {
      showNotification("error", "Erreur : Veuillez sélectionner un patient avant de valider.");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/medical-visits", {
        method: "POST",
        body: JSON.stringify(form)
      });

      if (res.ok) {
        showNotification("success", "Dossier médical transmis au LSPD avec succès.");
        setForm(initialForm);
        setSearchTerm(""); // Reset recherche
        loadData();
        setActiveTab("history");
      } else {
        showNotification("error", "Erreur serveur lors de l'enregistrement.");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <Layout>
      {/* --- MODAL NOTIFICATION CUSTOM (Remplacement Alert) --- */}
      {notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className={`h-2 w-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="p-6 flex flex-col items-center text-center">
              {notification.type === 'success' ? (
                <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
              )}
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {notification.type === 'success' ? 'Succès' : 'Attention'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                {notification.message}
              </p>
              <button 
                onClick={closeNotification}
                className="btn-primary w-full py-3"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader title="PPA - Visite Médicale" subtitle="Interface Professionnelle EMS / LSPD" />

      {/* --- NAVIGATION --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "new" 
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900" 
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <FileText size={18} /> Nouvelle Évaluation
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "history" 
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900" 
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <History size={18} /> Archives
          </button>
        </div>
      </div>

      {/* --- FORMULAIRE --- */}
      {activeTab === "new" && (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          
          {/* SECTION 1: SÉLECTION PATIENT AVANCÉE */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-700">
              <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><User size={20}/></span> 
              Identité du Patient
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recherche intelligente */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recherche Rapide</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Nom ou Prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Selecteur filtré */}
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sélection Finale</label>
                <select 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                >
                  <option value="">-- {filteredPatients.length} patient(s) trouvé(s) --</option>
                  {filteredPatients.map(p => (
                    <option key={p.id} value={p.id}>
                       {p.last_name.toUpperCase()} {p.first_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* SECTION 2: PSYCHOLOGIE */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-700">
                <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg"><Brain size={20}/></span> 
                Examen Psychologique
              </h3>
              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <SelectField
                    label="Attitude / Comportement"
                    value={form.psychology.global_opinion}
                    onChange={e => updatePsych("global_opinion", e.target.value)}
                    >
                    <option value="">-- Observer --</option>
                    <option value="Calme & Posé">🟢 Calme & Posé</option>
                    <option value="Coopératif">🔵 Coopératif</option>
                    <option value="Nerveux / Stressé">🟠 Nerveux / Stressé</option>
                    <option value="Menteur / Dissimulateur">🟠 Menteur</option>
                    <option value="Agressif / Instable">🔴 Agressif / Instable</option>
                    </SelectField>
                    <InputField 
                    label="Gestion du Stress" 
                    placeholder="Évaluation..."
                    value={form.psychology.stress_management}
                    onChange={e => updatePsych("stress_management", e.target.value)}
                    />
                </div>
                <TextArea 
                  label="Antécédents & Motivation" 
                  placeholder="Passé, enfance, pourquoi le PPA ?"
                  rows={3}
                  value={form.psychology.past}
                  onChange={e => updatePsych("past", e.target.value)}
                />
                <TextArea 
                  label="Réponse au Scénario (Braquage)" 
                  placeholder="Réaction face à une menace armée..."
                  rows={2}
                  value={form.psychology.scenario_response}
                  onChange={e => updatePsych("scenario_response", e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 3: PHYSIQUE */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-700">
                <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><Dumbbell size={20}/></span> 
                Tests Physiques
              </h3>
              
              {/* Constantes */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg mb-6 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <Activity size={14}/> Constantes Vitales
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InputField label="BPM Repos" type="number" placeholder="60-80" 
                    value={form.physical.bpm_rest} onChange={e => updatePhys("bpm_rest", e.target.value)} />
                  <InputField label="BPM Effort" type="number" placeholder="120+" 
                    value={form.physical.bpm_effort} onChange={e => updatePhys("bpm_effort", e.target.value)} />
                   <SelectField label="ECG" value={form.physical.ecg_status} onChange={e => updatePhys("ecg_status", e.target.value)}>
                      <option value="Normal">Normal</option>
                      <option value="Arythmie">Arythmie</option>
                      <option value="Tachycardie">Tachycardie</option>
                   </SelectField>
                </div>
              </div>

              {/* Checklist style bouton PRO */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "arm_strength", label: "Pompes (20)", icon: <Dumbbell size={18}/> },
                  { key: "leg_strength", label: "Squats (20)", icon: <Activity size={18}/> },
                  { key: "endurance", label: "Gainage", icon: <History size={18}/> },
                  { key: "sensory_test", label: "Vue / Ouïe", icon: <Eye size={18}/> },
                  { key: "motor_skills", label: "Stabilité", icon: <Brain size={18}/> },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => updatePhys(item.key, !form.physical[item.key])}
                    className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                        form.physical[item.key]
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                         form.physical[item.key] ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                    }`}>
                        {form.physical[item.key] && <CheckCircle size={14} />}
                    </div>
                    <span className="font-semibold text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: VERDICT FINAL (Barre d'action) */}
          <div className="sticky bottom-4 z-40 mt-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-t-4 border-slate-600 dark:border-slate-500 p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                
                <div className="flex-1 w-full">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Décision Finale</h4>
                    <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
                        {["Apte", "Apte sous réserve", "Inapte"].map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setForm({ ...form, verdict: v })}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${
                                    form.verdict === v 
                                    ? (v === "Apte" ? "bg-emerald-500 text-white" : v === "Inapte" ? "bg-red-500 text-white" : "bg-amber-500 text-white")
                                    : "bg-slate-50 dark:bg-slate-700 text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                {v.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center w-full md:w-auto">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Note Globale</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" min="0" max="20"
                            className="w-20 h-14 text-center text-3xl font-black bg-slate-100 dark:bg-slate-900 rounded-lg border-2 border-slate-300 focus:border-blue-500 outline-none"
                            value={form.global_note}
                            onChange={e => setForm({ ...form, global_note: parseInt(e.target.value) })}
                        />
                        <span className="text-xl font-bold text-slate-400">/20</span>
                    </div>
                </div>

                <div className="w-full md:w-auto md:min-w-[200px]">
                     <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full h-14 bg-slate-800 hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        {submitting ? (
                            <span className="animate-pulse">Envoi...</span>
                        ) : (
                            <> <ShieldCheck size={20} /> TRANSMETTRE </>
                        )}
                    </button>
                </div>

            </div>
          </div>
        </form>
      )}

      {/* --- HISTORIQUE --- */}
      {activeTab === "history" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {history.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300">
                <History className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Aucune archive disponible.</p>
            </div>
          ) : (
            history.map((visit) => (
              <div key={visit.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                      {visit.patient_first_name} {visit.patient_last_name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                       {new Date(visit.created_at).toLocaleDateString("fr-FR")} • Dr. {visit.medic_last_name}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-md text-xs font-bold text-white shadow-sm ${
                      visit.verdict === "Apte" ? "bg-emerald-500" : 
                      visit.verdict === "Inapte" ? "bg-red-500" : "bg-amber-500"
                  }`}>
                    {visit.verdict}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                   <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                       <span>Note: <b className="text-slate-800 dark:text-white">{visit.global_note}/20</b></span>
                       <span className="flex gap-1">
                           {visit.physical?.arm_strength && <span title="Force" className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                           {visit.physical?.ecg_status === "Normal" && <span title="Cœur" className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                           {visit.psychology?.global_opinion?.includes("Calme") && <span title="Psy" className="w-2 h-2 rounded-full bg-blue-500"></span>}
                       </span>
                   </div>
                   <p className="line-clamp-2 italic text-xs">"{visit.psychology?.global_opinion || "Aucun commentaire"}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
}
