import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import { Layout } from "../../components/layout/Layout";
import { InputField } from "../../components/ui/FormElements";
import { Save, Plus, Trash2 } from "lucide-react";

export function MyTeam() {
  const [team, setTeam] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [form, setForm] = useState({ name: "", team_principal: "", color: "#ff0000", base: "", power_unit: "" });
  const [newDriver, setNewDriver] = useState({ first_name: "", last_name: "", number: "" });

  // 1. Charger l'équipe de l'utilisateur
  const fetchMyTeam = async () => {
    try {
      // NOTE: Il faudrait créer une route GET /api/manage/my-team dans le backend.
      // Pour l'instant, on suppose qu'on récupère l'équipe où owner_id = current_user.
      // Simulation pour le frontend : on tente de charger.
      const res = await apiFetch("/api/manage/my-team"); 
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setDrivers(data.drivers || []);
        setForm(data.team);
      }
    } catch (e) { console.log("Pas d'équipe encore"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMyTeam(); }, []);

  // 2. Créer / Mettre à jour l'équipe
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    try {
      const endpoint = team ? `/api/manage/teams/${team.id}` : "/api/manage/teams";
      const method = team ? "PUT" : "POST";
      
      const res = await apiFetch(endpoint, { method, body: form });
      const data = await res.json();
      if (res.ok) {
         setTeam(data);
         alert("Écurie enregistrée !");
      }
    } catch (e) { alert("Erreur sauvegarde"); }
  };

  // 3. Ajouter un pilote
  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!team) return alert("Créez l'écurie d'abord !");
    try {
        const res = await apiFetch(`/api/manage/teams/${team.id}/drivers`, { method: "POST", body: newDriver });
        if (res.ok) {
            setDrivers([...drivers, await res.json()]);
            setNewDriver({ first_name: "", last_name: "", number: "" });
        }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <Layout>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE : INFO ÉCURIE */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <Save size={20} /> Identité Écurie
                </h2>
                <form onSubmit={handleSaveTeam} className="space-y-4">
                    <InputField label="Nom de l'écurie" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    <InputField label="Team Principal" value={form.team_principal} onChange={e => setForm({...form, team_principal: e.target.value})} />
                    <InputField label="Base (Ville, Pays)" value={form.base} onChange={e => setForm({...form, base: e.target.value})} />
                    <div>
                        <label className="label">Couleur Officielle</label>
                        <div className="flex gap-2 items-center">
                            <input type="color" className="w-10 h-10 rounded cursor-pointer" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
                            <span className="text-sm dark:text-white">{form.color}</span>
                        </div>
                    </div>
                    <InputField label="Moteur (Power Unit)" value={form.power_unit} onChange={e => setForm({...form, power_unit: e.target.value})} placeholder="ex: Ferrari, RBPT..." />
                    
                    <button className="btn-primary w-full mt-4">
                        {team ? "Mettre à jour" : "Créer l'Écurie"}
                    </button>
                </form>
            </div>
        </div>

        {/* COLONNE DROITE : PILOTES & STAFF */}
        <div className="lg:col-span-2 space-y-6">
            {!team ? (
                <div className="bg-blue-50 text-blue-800 p-8 rounded-xl text-center">
                    Commencez par créer votre écurie pour gérer vos pilotes.
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">Nos Pilotes</h2>
                    
                    {/* Liste Pilotes */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        {drivers.map(driver => (
                            <div key={driver.id} className="p-4 border dark:border-slate-600 rounded-lg flex justify-between items-center bg-slate-50 dark:bg-slate-700">
                                <div>
                                    <span className="text-2xl font-black text-slate-200 dark:text-slate-600 mr-2">#{driver.number}</span>
                                    <span className="font-bold dark:text-white">{driver.first_name} {driver.last_name}</span>
                                </div>
                                {/* Bouton delete fictif pour l'instant */}
                                <button className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                            </div>
                        ))}
                    </div>

                    {/* Ajout Pilote */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">Recruter un pilote</h3>
                        <form onSubmit={handleAddDriver} className="flex flex-col sm:flex-row gap-3">
                            <input type="text" placeholder="Prénom" className="input-field" value={newDriver.first_name} onChange={e => setNewDriver({...newDriver, first_name: e.target.value})} required />
                            <input type="text" placeholder="Nom" className="input-field" value={newDriver.last_name} onChange={e => setNewDriver({...newDriver, last_name: e.target.value})} required />
                            <input type="number" placeholder="N°" className="input-field w-20" value={newDriver.number} onChange={e => setNewDriver({...newDriver, number: e.target.value})} required />
                            <button type="submit" className="btn-secondary whitespace-nowrap"><Plus size={18}/> Ajouter</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
}
