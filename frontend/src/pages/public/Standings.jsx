import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import { Layout, PageHeader, LoadingScreen } from "../../components";
import { Trophy, Medal } from "lucide-react";

export function Standings() {
  const [drivers, setDrivers] = useState([]);
  const [constructors, setConstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("drivers");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, cRes] = await Promise.all([
            apiFetch("/api/championship/standings/drivers"),
            apiFetch("/api/championship/standings/constructors")
        ]);
        setDrivers(await dRes.json());
        setConstructors(await cRes.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Layout>
      <PageHeader title="Classements Championnat" subtitle="Saison 2026" />

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
            onClick={() => setActiveTab("drivers")}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'drivers' ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
        >
            PILOTES
        </button>
        <button 
            onClick={() => setActiveTab("constructors")}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'constructors' ? 'bg-red-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
        >
            CONSTRUCTEURS
        </button>
      </div>

      {/* Driver Standings */}
      {activeTab === "drivers" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                        <th className="p-4 text-left">Pos</th>
                        <th className="p-4 text-left">Pilote</th>
                        <th className="p-4 text-left">Écurie</th>
                        <th className="p-4 text-center">Victoires</th>
                        <th className="p-4 text-right">Points</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {drivers.map((d, i) => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="p-4 font-mono font-bold text-slate-400">
                                {i+1 === 1 ? <Medal className="text-yellow-400 fill-current" size={20}/> : 
                                 i+1 === 2 ? <Medal className="text-slate-400 fill-current" size={20}/> : 
                                 i+1 === 3 ? <Medal className="text-amber-700 fill-current" size={20}/> : i+1}
                            </td>
                            <td className="p-4">
                                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                    <div className="w-1 h-8 rounded-full" style={{backgroundColor: d.team_color}}></div>
                                    {d.first_name} <span className="uppercase">{d.last_name}</span>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-slate-500">{d.team_name}</td>
                            <td className="p-4 text-center font-mono">{d.wins}</td>
                            <td className="p-4 text-right font-mono font-black text-lg text-slate-800 dark:text-white">{d.points} PTS</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </Layout>
  );
}
