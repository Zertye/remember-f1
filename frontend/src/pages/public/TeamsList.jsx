import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import { Layout } from "../../components/layout/Layout";
import { LoadingScreen } from "../../components";
import { Users } from "lucide-react";

export function TeamsList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On utilise l'endpoint standings/constructors car il retourne la liste des teams avec leurs points
    apiFetch("/api/championship/standings/constructors")
      .then(res => res.json())
      .then(data => setTeams(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">
          Les Écuries <span className="text-red-600">2026</span>
        </h1>
        <p className="text-slate-500">Plateau officiel du championnat</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all group">
            <div className="h-24 relative" style={{ backgroundColor: team.color || '#333' }}>
               {/* Pattern overlay optional */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
               <h3 className="absolute bottom-3 left-4 text-white text-xl font-black uppercase italic drop-shadow-md">
                 {team.name}
               </h3>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Team Principal</p>
                    <p className="font-medium text-slate-800 dark:text-white">{team.team_principal || "Non défini"}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase">Base</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{team.base || "Inconnue"}</p>
                 </div>
              </div>
              
              <div className="mt-4 pt-4 border-t dark:border-slate-700 flex justify-between items-center">
                 <div className="text-2xl font-black text-slate-800 dark:text-white">{team.points} <span className="text-xs font-normal text-slate-500">PTS</span></div>
                 {team.power_unit && <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs rounded font-mono">{team.power_unit}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
