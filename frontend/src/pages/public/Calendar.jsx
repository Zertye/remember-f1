import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import { Layout } from "../../components/layout/Layout";
import { LoadingScreen } from "../../components";
import { Calendar as CalendarIcon, MapPin, Flag } from "lucide-react";

export function Calendar() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/championship/calendar")
      .then((res) => res.json())
      .then((data) => setRaces(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">
          Calendrier <span className="text-red-600">2026</span>
        </h1>
        <p className="text-slate-500">Programme officiel du championnat du monde</p>
      </div>

      <div className="space-y-4">
        {races.map((race, index) => {
          const isCompleted = race.status === "completed";
          const date = new Date(race.date);

          return (
            <div 
              key={race.id} 
              className={`relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl border transition-all ${
                isCompleted 
                  ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75 grayscale-[0.5]" 
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg hover:border-red-500/50"
              }`}
            >
              {/* Date Badge */}
              <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0 border border-slate-200 dark:border-slate-600">
                <span className="text-xs font-bold uppercase text-red-600">{date.toLocaleString('default', { month: 'short' })}</span>
                <span className="text-3xl font-black text-slate-800 dark:text-white">{date.getDate()}</span>
              </div>

              {/* Info Course */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manche {index + 1}</span>
                   {race.is_sprint && <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-600 text-[10px] font-bold uppercase rounded-full">Sprint</span>}
                </div>
                <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white mb-2">
                  {race.name}
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14}/> {race.circuit_name}</span>
                  <span className="flex items-center gap-1"><Flag size={14}/> {race.laps} Tours</span>
                </div>
              </div>

              {/* Status / Action */}
              <div className="shrink-0">
                {isCompleted ? (
                   <span className="px-4 py-2 rounded-full border border-slate-200 text-slate-400 text-sm font-bold bg-slate-100 dark:bg-slate-800 dark:border-slate-700">
                     Terminé
                   </span>
                ) : (
                   <button className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/20 transition-all">
                     Infos Circuit
                   </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
