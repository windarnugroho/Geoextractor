import React from 'react';
import { MapPin, Sparkles, Download, Trash2, Layers, FileSpreadsheet, Globe } from 'lucide-react';

interface NavbarProps {
  totalPoints: number;
  totalDocuments: number;
  onLoadAllSamples: () => void;
  onClearAll: () => void;
  onOpenExport: () => void;
  activeView: 'table' | 'map' | 'combined';
  setActiveView: (view: 'table' | 'map' | 'combined') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalPoints,
  totalDocuments,
  onLoadAllSamples,
  onClearAll,
  onOpenExport,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0F0F12]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-bold">
            <MapPin className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white">GeoExtract <span className="text-indigo-400">AI</span></h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.0 AI GIS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Ekstraktor & Integrator Koordinat Multi-Sumber
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="hidden md:flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveView('combined')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeView === 'combined'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tampilan Terpadu
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeView === 'table'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Tabel Terpusat ({totalPoints})
          </button>
          <button
            onClick={() => setActiveView('map')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeView === 'map'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Peta Digital
          </button>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadAllSamples}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
            title="Muat & integrasikan 3 sampel foto terlampir"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span className="hidden lg:inline">Ekstrak 3 Sampel Terlampir</span>
            <span className="lg:hidden">3 Sampel</span>
          </button>

          {totalPoints > 0 && (
            <>
              <button
                onClick={onOpenExport}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor</span>
              </button>

              <button
                onClick={onClearAll}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                title="Reset/Bersihkan semua data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};
