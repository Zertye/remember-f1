/**
 * Reports - Gestion des rapports médicaux (Version Pro Tabulaire)
 */
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { 
  FilePlus, Trash2, X, Minus, Plus, Search, Filter, 
  Eye, Calendar, User, Stethoscope, ChevronDown, FileText
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../utils/api";
import { PERMISSIONS } from "../../utils/permissions";
import { Layout, PageHeader, SelectField, TextArea, InputField, Badge } from "../../components";

// --- CONFIGURATION DES SERVICES ---
const SERVICES_LIST = [
  {
    cat: "Pharmacie",
    items: [
      { n: "Big Heal", p: 150 },
      { n: "Small Heal", p: 100 },
    ],
  },
  {
    cat: "Officine",
    items: [
      { n: "Acide Tranexamique", p: 50 },
      { n: "Céfotaxime", p: 50 },
      { n: "Dexaméthasone", p: 75 },
      { n: "Ribavirine", p: 100 },
    ],
  },
  {
    cat: "Soins & Équipements",
    items: [
      { n: "Bandage", p: 15 },
      { n: "Bandage à la tête", p: 20 },
      { n: "Bandage au bras", p: 15 },
      { n: "Bandage corporel", p: 25 },
      { n: "Diagnostic (T° / Pouls)", p: 150 },
      { n: "Kit médical", p: 400 },
      { n: "Plâtre à la jambe", p: 50 },
      { n: "Réanimation", p: 400 },
      { n: "Scanner", p: 250 },
    ],
  },
  {
    cat: "Divers",
    items: [{ n: "Chambre VIP", p: 500 }],
  },
];

export function Reports() {
  const { hasPerm } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get("patient_id");

  // --- ÉTATS ---
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null); // Pour la vue détail

  // Filtres
  const [search, setSearch] = useState("");
  const [filterMedic, setFilterMedic] = useState("");
  const [filterDisease, setFilterDisease] = useState("");
  const [filterPatientId, setFilterPatientId] = useState(initialPatientId || "");

  // Formulaire Création
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [form, setForm] = useState({
    patient_id: initialPatientId || "",
    disease: "",
    context_notes: "",
    medications: [],
    total_cost: 0,
  });

  // --- CHARGEMENT DES DONNÉES ---
  const loadData = async () => {
    setLoading(true);
    try {
      // On demande plus de rapports pour que la vue tableau soit pertinente
      let url = "/api/reports?limit=200";
      if (filterPatientId) url += `&patient_id=${filterPatientId}`;
      
      const reportsRes = await apiFetch(url);
      if (reportsRes.ok) setReports(await reportsRes.json());

      const patientsRes = await apiFetch("/api/patients");
      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(Array.isArray(data?.patients) ? data.patients : []);
      }

      const diseasesRes = await apiFetch("/api/reports/diseases");
      if (diseasesRes.ok) setDiseases(await diseasesRes.json());
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterPatientId]);

  // --- LOGIQUE DE FILTRAGE ---
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Recherche textuelle (Nom, Prénom, ID Patient, Diagnostic, ID Rapport)
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        search === "" ||
        r.patient_last_name?.toLowerCase().includes(searchLower) ||
        r.patient_first_name?.toLowerCase().includes(searchLower) ||
        String(r.patient_identity_id || "").toLowerCase().includes(searchLower) ||
        String(r.diagnosis || "").toLowerCase().includes(searchLower) ||
        String(r.id).includes(searchLower);

      // Filtres Select
      const matchesMedic = filterMedic === "" || r.medic_id === parseInt(filterMedic);
      const matchesDisease = filterDisease === "" || r.diagnosis === filterDisease;
      
      return matchesSearch && matchesMedic && matchesDisease;
    });
  }, [reports, search, filterMedic, filterDisease]);

  // Liste unique des médecins pour le filtre (extraite des rapports chargés)
  const medicsList = useMemo(() => {
    const unique = new Map();
    reports.forEach(r => {
      if (!unique.has(r.medic_id)) {
        unique.set(r.medic_id, { id: r.medic_id, name: `${r.medic_first_name} ${r.medic_last_name}` });
      }
    });
    return Array.from(unique.values());
  }, [reports]);

  // --- ACTIONS DU FORMULAIRE ---
  const updateMedsAndCost = (newMeds) => {
    let cost = 0;
    newMeds.forEach(medName => {
      for (const cat of SERVICES_LIST) {
        const found = cat.items.find(i => i.n === medName);
        if (found) { cost += found.p; break; }
      }
    });
    setForm({ ...form, medications: newMeds, total_cost: cost });
  };

  const addService = (item) => updateMedsAndCost([...form.medications, item.n]);
  
  const removeService = (e, item) => {
    e.stopPropagation();
    const index = form.medications.indexOf(item.n);
    if (index > -1) {
      const newMeds = [...form.medications];
      newMeds.splice(index, 1);
      updateMedsAndCost(newMeds);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDisease = form.disease === "Autre" ? customDiagnosis : form.disease;
    try {
      const response = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({ ...form, disease: finalDisease }),
      });
      if (response.ok) {
        setShowCreateModal(false);
        setForm({ patient_id: "", disease: "", context_notes: "", medications: [], total_cost: 0 });
        setCustomDiagnosis("");
        loadData();
      }
    } catch (error) {
      console.error("Erreur création rapport:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rapport définitivement ?")) return;
    try {
      const response = await apiFetch(`/api/reports/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSelectedReport(null); // Fermer le modal si ouvert
        loadData();
      }
    } catch (error) { console.error(error); }
  };

  // --- RENDU UI ---
  return (
    <Layout>
      <PageHeader 
        title="Rapports Médicaux" 
        subtitle="Historique des interventions et facturation"
        action={
          hasPerm(PERMISSIONS.CREATE_REPORTS) && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <FilePlus size={18} /> Nouveau rapport
            </button>
          )
        }
      />

      {/* --- BARRE D'OUTILS ET FILTRES --- */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4 items-end">
          {/* Recherche */}
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Patient, ID..." 
                className="input-field pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filtre Diagnostic */}
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Diagnostic</label>
            <div className="relative">
              <select 
                className="input-field w-full appearance-none"
                value={filterDisease}
                onChange={(e) => setFilterDisease(e.target.value)}
              >
                <option value="">Tous les diagnostics</option>
                {diseases.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Filtre Médecin */}
          <div className="md:col-span-1">
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Médecin Traitant</label>
             <div className="relative">
              <select 
                className="input-field w-full appearance-none"
                value={filterMedic}
                onChange={(e) => setFilterMedic(e.target.value)}
              >
                <option value="">Tous les médecins</option>
                {medicsList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <User className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Reset */}
          <div className="flex justify-end pb-1">
            {(search || filterDisease || filterMedic || filterPatientId) && (
              <button 
                onClick={() => { setSearch(""); setFilterDisease(""); setFilterMedic(""); setFilterPatientId(""); }}
                className="text-red-600 text-sm font-semibold hover:underline flex items-center gap-1"
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- TABLEAU DES RAPPORTS --- */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <th className="p-4 w-40">Date</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Diagnostic</th>
                <th className="p-4">Médecin</th>
                <th className="p-4 text-right">Montant</th>
                <th className="p-4 text-center w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Chargement des dossiers...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Aucun rapport ne correspond à votre recherche.</td></tr>
              ) : (
                filteredReports.map((r) => (
                  <tr 
                    key={r.id} 
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedReport(r)}
                  >
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono text-sm">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(r.incident_date).toLocaleDateString("fr-FR")}
                        <span className="text-xs text-slate-400 hidden lg:inline">
                          {new Date(r.incident_date).toLocaleTimeString("fr-FR", {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-white">
                        {r.patient_last_name} {r.patient_first_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ID: {r.patient_identity_id}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        r.diagnosis.includes("Balle") || r.diagnosis.includes("Arme") 
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                      }`}>
                        {r.diagnosis}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {r.medic_first_name?.[0]}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                          {r.medic_last_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {r.treatment.includes("Coût") ? r.treatment.replace("Coût Total: ", "") : "0$"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                       <button className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex justify-between items-center">
          <span>Affichage de {filteredReports.length} rapport(s)</span>
          <span>Double-cliquez pour voir les détails</span>
        </div>
      </div>

      {/* --- MODAL DE DÉTAILS (VISUALISATION) --- */}
      {selectedReport && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 border dark:border-slate-700 flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className="p-6 border-b dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50 rounded-t-xl flex-shrink-0">
                 <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <FileText className="text-blue-600" /> Dossier Médical #{selectedReport.id}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                       <Calendar size={14} /> Créé le {new Date(selectedReport.incident_date).toLocaleString("fr-FR")}
                    </p>
                 </div>
                 <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                    <X size={20} />
                 </button>
              </div>

              {/* Content Modal */}
              <div className="p-6 overflow-y-auto space-y-6">
                 
                 {/* Infos Patient & Medecin */}
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                       <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block flex items-center gap-1"><User size={12}/> Patient</span>
                       <div className="font-bold text-lg text-slate-800 dark:text-white truncate">
                          {selectedReport.patient_last_name} {selectedReport.patient_first_name}
                       </div>
                       <div className="text-sm text-slate-500 font-mono">
                          ID: {selectedReport.patient_identity_id}
                       </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1"><Stethoscope size={12}/> Médecin Traitant</span>
                       <div className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2 truncate">
                          Dr. {selectedReport.medic_first_name} {selectedReport.medic_last_name}
                       </div>
                       <div className="text-sm text-slate-500 font-mono">
                          Matricule: {selectedReport.medic_badge || "N/A"}
                       </div>
                    </div>
                 </div>

                 {/* Diagnostic & Notes */}
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">
                       Diagnostic & Observations
                    </h3>
                    <div className="mb-4">
                       <span className="inline-block px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 shadow-sm">
                          {selectedReport.diagnosis}
                       </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap border border-slate-100 dark:border-slate-700 font-sans">
                       {selectedReport.notes || "Aucune note contextuelle saisie."}
                    </div>
                 </div>

                 {/* Traitement */}
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">
                       Soins Prodigués & Facturation
                    </h3>
                    <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                       <div className="text-sm text-slate-600 dark:text-slate-300">
                          {selectedReport.medications_given ? selectedReport.medications_given.split(',').map((med, i) => (
                             <span key={i} className="inline-block bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 mr-2 mb-2 shadow-sm">
                                {med.trim()}
                             </span>
                          )) : "Aucun soin facturé"}
                       </div>
                       <div className="text-right ml-4 min-w-[100px]">
                          <div className="text-xs text-slate-500 uppercase font-bold">Total Facturé</div>
                          <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                             {selectedReport.treatment.includes("Coût") ? selectedReport.treatment.replace("Coût Total: ", "") : "0$"}
                          </div>
                       </div>
                    </div>
                 </div>

              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-between flex-shrink-0">
                 {hasPerm(PERMISSIONS.DELETE_REPORTS) ? (
                    <button 
                       onClick={() => handleDelete(selectedReport.id)}
                       className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                       <Trash2 size={16} /> Supprimer ce rapport
                    </button>
                 ) : <div></div>}
                 
                 <button 
                    onClick={() => setSelectedReport(null)}
                    className="btn-primary px-6"
                 >
                    Fermer
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL DE CRÉATION (INLINE POUR SIMPLICITÉ) --- */}
      {showCreateModal && (
        <CreateReportModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          patients={patients}
          diseases={diseases}
          customDiagnosis={customDiagnosis}
          setCustomDiagnosis={setCustomDiagnosis}
          addService={addService}
          removeService={removeService}
          getCount={(n) => form.medications.filter(m => m === n).length}
        />
      )}
    </Layout>
  );
}

// Sous-composant pour le Modal de Création (Pour garder le fichier propre et lisible)
function CreateReportModal({ onClose, onSubmit, form, setForm, patients, diseases, customDiagnosis, setCustomDiagnosis, addService, removeService, getCount }) {
  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col animate-in border dark:border-slate-700">
        <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl flex-shrink-0">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <FilePlus size={20} className="text-blue-600"/> Nouveau Rapport d'Intervention
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500"><X size={20} /></button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <SelectField label="Patient concerné" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">-- Sélectionner dans la base --</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.last_name} {p.first_name} ({p.insurance_number})</option>)}
              </SelectField>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                <SelectField label="Pathologie / Diagnostic" value={form.disease} onChange={(e) => setForm({ ...form, disease: e.target.value })} required>
                  <option value="">-- Choisir --</option>
                  {diseases.map((d) => <option key={d} value={d}>{d}</option>)}
                  <option value="Autre">Autre (Texte libre)</option>
                </SelectField>
                {form.disease === "Autre" && (
                  <div className="mt-3 animate-in"><InputField placeholder="Précisez le diagnostic..." value={customDiagnosis} onChange={(e) => setCustomDiagnosis(e.target.value)} required /></div>
                )}
              </div>

              <TextArea label="Contexte & Observations" placeholder="Détails de l'intervention..." value={form.context_notes} onChange={(e) => setForm({ ...form, context_notes: e.target.value })} className="h-32" />
            </div>

            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold uppercase text-slate-500">Facturation & Soins</h3>
                 <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{form.total_cost} $</span>
              </div>
              
              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto max-h-[400px]">
                {SERVICES_LIST.map((cat) => (
                  <div key={cat.cat} className="mb-6 last:mb-0">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 border-b border-blue-100 dark:border-slate-700 pb-1">{cat.cat}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.items.map((item) => {
                        const count = getCount(item.n);
                        return (
                          <div key={item.n} onClick={() => addService(item)}
                            className={`p-2.5 rounded-lg cursor-pointer border text-sm flex justify-between items-center transition-all select-none ${
                              count > 0 ? "bg-white dark:bg-slate-800 border-blue-400 shadow-sm" : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{item.n}</span>
                              <span className="text-xs text-slate-400 font-mono">{item.p}$</span>
                            </div>
                            {count > 0 ? (
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => removeService(e, item)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-500 hover:bg-red-50"><Minus size={12}/></button>
                                <span className="w-6 text-center font-bold text-blue-600">{count}</span>
                              </div>
                            ) : <Plus size={16} className="text-slate-300" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary px-6">Annuler</button>
            <button type="submit" className="btn-primary px-8">Enregistrer le rapport</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Reports;
