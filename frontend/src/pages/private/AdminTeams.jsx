import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import { Layout } from "../../components/layout/Layout";
import { Trash2, ShieldAlert } from "lucide-react";

export function AdminTeams() {
  const [teams, setTeams] = useState([]);
  
  // Fonction pour charger les équipes
  const loadTeams = () => {
    // On utilise la route publique pour lister, ou on pourrait créer une route admin spécifique
    apiFetch("/api/championship/standings/constructors")
      .then(res => res.json())
      .then(data => setTeams(data))
      .catch(console.error);
  };

  useEffect(() => { loadTeams(); }, []);

  const handleDelete = async (id) => {
    if(!confirm("ATTENTION: Supprimer cette écurie supprimera aussi ses pilotes et son historique. Continuer ?")) return;
    
    try {
        // Note: Il faudra s'assurer que cette route DELETE existe dans backend/routes/management.js ou admin.js
        // Pour l'instant, c'est structurel pour que le frontend compile.
        await apiFetch(`/api/admin/teams/${id}`, { method: "DELETE" });
        loadTeams(); 
    } catch (e) {
        alert("Erreur suppression (Route API à implémenter)");
    }
  };

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="text-red-600" size={32} />
        <h1 className="text-2xl font-black uppercase text-slate-800 dark:text-white">Administration des Écuries</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-xs font-bold">
                <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Nom Écurie</th>
                    <th className="p-4">Directeur</th>
                    <th className="p-4">Propriétaire (User ID)</th>
                    <th className="p-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {teams.map(team => (
                    <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-4 font-mono text-slate-400">#{team.id}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: team.color}}></div>
                            {team.name}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{team.team_principal || "-"}</td>
                        <td className="p-4 font-mono text-xs">{team.owner_id ? `User #${team.owner_id}` : "Système"}</td>
                        <td className="p-4 text-right">
                            <button 
                                onClick={() => handleDelete(team.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Supprimer l'écurie"
                            >
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {teams.length === 0 && <div className="p-8 text-center text-slate-500">Aucune écurie inscrite.</div>}
      </div>
    </Layout>
  );
}
