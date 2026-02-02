import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Users, Calendar } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-red-600">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background abstract */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 z-0"></div>
        <div className="absolute -right-20 top-20 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]"></div>

        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 text-center">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-6">
                F1 MANAGER <span className="text-red-600">2026</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto font-light">
                Créez votre écurie, gérez vos pilotes et dominez le championnat mondial. 
                La simulation de gestion ultime.
            </p>
            
            <div className="flex justify-center gap-4">
                <Link to="/login" className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all flex items-center gap-2">
                    Démarrer ma Carrière <ArrowRight size={20}/>
                </Link>
                <Link to="/standings" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white rounded-lg font-bold text-lg transition-all">
                    Voir les Classements
                </Link>
            </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-10">
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-red-500/50 transition-colors">
                  <Users className="text-red-500 mb-4" size={40} />
                  <h3 className="text-xl font-bold mb-2">Gestion d'Écurie</h3>
                  <p className="text-slate-400">Recrutez votre staff, signez des pilotes et développez votre monoplace.</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-red-500/50 transition-colors">
                  <Calendar className="text-red-500 mb-4" size={40} />
                  <h3 className="text-xl font-bold mb-2">Saison Complète</h3>
                  <p className="text-slate-400">Un calendrier de 24 courses à travers le monde. Gérez la fatigue et la stratégie.</p>
              </div>
              <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-red-500/50 transition-colors">
                  <Trophy className="text-red-500 mb-4" size={40} />
                  <h3 className="text-xl font-bold mb-2">Gloire & Podium</h3>
                  <p className="text-slate-400">Grimpez au classement constructeurs et gagnez les primes de fin de saison.</p>
              </div>
          </div>
      </div>
    </div>
  );
}
