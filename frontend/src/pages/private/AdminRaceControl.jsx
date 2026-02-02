import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import { Layout } from "../../components/layout/Layout";
import { Trophy, CheckCircle } from "lucide-react";

export function AdminRaceControl() {
  const [races, setRaces] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [results, setResults] = useState([]); // Array of { position, driver_id, fastest_lap }
  const [saving, setSaving] = useState(false);

  // Charger Calendrier et Pilotes au montage
  useEffect(() => {
    Promise.all([
        apiFetch("/api/championship/calendar").then(r => r.json()),
        apiFetch("/api/championship/standings/drivers").then(r => r.json())
    ]).then(([racesData, driversData]) => {
        setRaces(racesData);
        setDrivers(driversData);
    });
  }, []);

  // Initialiser les 20 lignes de résultats quand on choisit une course
  useEffect(() => {
    if (selectedRace) {
        // Crée 20 slots vides
        setResults(Array(20).fill(null).map((_, i) => ({ position: i + 1, driver_id: "", fastest_lap: false, status: "finished" })));
    }
  }, [selectedRace]);

  const updateResult = (index, field, value) => {
    const newResults = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  const handleSubmit = async () => {
    if (!confirm("Publier ces résultats ? Cela mettra à jour les classements.")) return;
    setSaving(true);
    try {
        // Filtrer les entrées vides
        const cleanResults = results.filter(r => r.driver_id !== "");
        await apiFetch(`/api/manage/races/${selectedRace}/publish-results`, {
            method: "POST",
            body: { results: cleanResults }
        });
        alert("Résultats publiés avec succès !");
    } catch (e) {
        alert("Erreur publication");
        console.error(e);
    } finally {
        setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2 dark:text-white">
            <Trophy className="text-red-600" /> RACE CONTROL
        </h1>

        {/* 1. SÉLECTION DU GP */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow mb-6">
            <label className="label">Sélectionner le Grand Prix</label>
            <select className="input-field" value={selectedRace} onChange={(e) => setSelectedRace(e.target.value)}>
                <option value="">-- Choisir une course --</option>
                {races.map(race => (
                    <option key={race.id} value={race.id}>
                        {new Date(race.date).toLocaleDateString()} - {race.name} ({race.status})
                    </option>
                ))}
            </select>
        </div>

        {/* 2. GRILLE RÉSULTATS */}
        {selectedRace && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow animate-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold dark:text-white">Classement Final</h2>
                    <button onClick={handleSubmit} disabled={saving} className="btn-primary flex gap-2 items-center">
                        <CheckCircle size={18} /> {saving ? "Publication..." : "Valider & Publier"}
                    </button>
                </div>

                <div className="space-y-2">
                    {results.map((res, index) => (
                        <div key={index} className="flex items-center gap-4 p-2 bg-slate-50 dark:bg-slate-900 rounded border dark:border-slate-700">
                            <span className="font-mono font-bold w-8 text-center text-slate-500">{res.position}</span>
                            
                            {/* Choix Pilote */}
                            <select 
                                className="input-field flex-1 py-1"
                                value={res.driver_id}
                                onChange={(e) => updateResult(index, "driver_id", e.target.value)}
                            >
                                <option value="">-- Pilote --</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>#{d.number} {d.last_name} ({d.team_name})</option>
                                ))}
                            </select>

                            {/* Statut */}
                            <select 
                                className="input-field w-32 py-1 text-xs"
                                value={res.status}
                                onChange={(e) => updateResult(index, "status", e.target.value)}
                            >
                                <option value="finished">Fini</option>
                                <option value="dnf">DNF (Abandon)</option>
                                <option value="dsq">DSQ (Disqualifié)</option>
                            </select>

                            {/* Checkbox Meilleur Tour */}
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none dark:text-slate-300">
                                <input 
                                    type="checkbox" 
                                    checked={res.fastest_lap} 
                                    onChange={(e) => updateResult(index, "fastest_lap", e.target.checked)}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                />
                                FL
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
}
