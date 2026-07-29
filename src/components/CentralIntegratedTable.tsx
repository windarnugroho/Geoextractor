import React, { useState, useMemo } from 'react';
import { CoordinatePoint, ExtractedDocument } from '../types';
import { formatDMS, calculatePolygonAreaHa, calculatePerimeterKm, decimalToDMS, latLongToUTM } from '../utils/geo';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  Edit3, 
  Plus, 
  Copy, 
  Check, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Maximize2 
} from 'lucide-react';

interface CentralIntegratedTableProps {
  documents: ExtractedDocument[];
  allPoints: CoordinatePoint[];
  onUpdatePoint: (point: CoordinatePoint) => void;
  onDeletePoint: (id: string) => void;
  onAddManualPoint: () => void;
  onClearAll: () => void;
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
}

export const CentralIntegratedTable: React.FC<CentralIntegratedTableProps> = ({
  documents,
  allPoints,
  onUpdatePoint,
  onDeletePoint,
  onAddManualPoint,
  onClearAll,
  selectedPointId,
  onSelectPoint,
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [editingPoint, setEditingPoint] = useState<CoordinatePoint | null>(null);

  // Filter Points
  const filteredPoints = useMemo(() => {
    return allPoints.filter(p => {
      const matchSource = selectedSourceId === 'ALL' || p.sourceName === selectedSourceId;
      const matchQuery = 
        p.pointNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSource && matchQuery;
    }).sort((a, b) => {
      const numA = parseInt(a.pointNumber.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.pointNumber.replace(/\D/g, ''), 10) || 0;
      return sortAsc ? numA - numB : numB - numA;
    });
  }, [allPoints, selectedSourceId, searchQuery, sortAsc]);

  // Statistics
  const areaHa = useMemo(() => calculatePolygonAreaHa(filteredPoints), [filteredPoints]);
  const perimeterKm = useMemo(() => calculatePerimeterKm(filteredPoints), [filteredPoints]);

  // Check for duplicate point numbers
  const duplicateWarnings = useMemo(() => {
    const pointCounts: Record<string, number> = {};
    allPoints.forEach(p => {
      pointCounts[p.pointNumber] = (pointCounts[p.pointNumber] || 0) + 1;
    });
    return Object.keys(pointCounts).filter(num => pointCounts[num] > 1);
  }, [allPoints]);

  // Copy Tabular Text to Clipboard
  const handleCopyTable = () => {
    const header = "No. Titik\tSumber\tBujur Timur (BT)\tLintang Selatan (LS)\tLatitude\tLongitude\tUTM Zone\tEasting X\tNorthing Y\n";
    const body = filteredPoints.map(p => 
      `${p.pointNumber}\t${p.sourceName}\t${formatDMS(p.dmsLongitude)}\t${formatDMS(p.dmsLatitude)}\t${p.latitude}\t${p.longitude}\t${p.utmZone || ''}\t${p.utmEasting || ''}\t${p.utmNorthing || ''}`
    ).join('\n');

    navigator.clipboard.writeText(header + body);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Handle Save Edit
  const handleSaveEdit = () => {
    if (!editingPoint) return;
    onUpdatePoint(editingPoint);
    setEditingPoint(null);
  };

  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/10 p-5 shadow-2xl flex flex-col gap-4">
      
      {/* Header & Stats Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">Tabel Terpusat Terintegrasi</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data gabungan dari seluruh foto watermark, scan dokumen IUP, dan teks chat yang telah diekstrak.
          </p>
        </div>

        {/* Integrated Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-[#121216] px-3 py-2 rounded-lg border border-white/10 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Titik</span>
            <span className="text-base font-semibold text-indigo-400">{allPoints.length} Titik</span>
          </div>
          <div className="bg-[#121216] px-3 py-2 rounded-lg border border-white/10 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Sumber Berkas</span>
            <span className="text-base font-semibold text-teal-300">{documents.length} Berkas</span>
          </div>
          <div className="bg-[#121216] px-3 py-2 rounded-lg border border-white/10 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Luas Area Poligon</span>
            <span className="text-base font-semibold text-amber-300">{areaHa > 0 ? `${areaHa} Ha` : '-'}</span>
          </div>
          <div className="bg-[#121216] px-3 py-2 rounded-lg border border-white/10 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Keliling Batas</span>
            <span className="text-base font-semibold text-emerald-400">{perimeterKm > 0 ? `${perimeterKm} km` : '-'}</span>
          </div>
        </div>
      </div>

      {/* Warnings & Validation Alerts */}
      {duplicateWarnings.length > 0 && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Ditemukan duplikasi nomor titik pada data ({duplicateWarnings.map(n => `Titik ${n}`).join(', ')}).
            </span>
          </div>
        </div>
      )}

      {/* Controls Bar (Filter, Search, Actions) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Source Dropdown Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-[#121216] border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none font-medium"
            >
              <option value="ALL">Semua Sumber Data ({allPoints.length} Titik)</option>
              {Array.from(new Set(allPoints.map(p => p.sourceName))).map(src => (
                <option key={src} value={src}>
                  {src} ({allPoints.filter(p => p.sourceName === src).length} titik)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121216] border border-white/10 hover:border-white/20 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            title="Urutkan Nomor Titik"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortAsc ? '1 → N' : 'N → 1'}</span>
          </button>
        </div>

        {/* Search Bar & Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor titik..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#121216] border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleCopyTable}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors"
            title="Salin data ke clipboard"
          >
            {copiedSuccess ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedSuccess ? 'Tersalin!' : 'Salin Text'}</span>
          </button>

          <button
            onClick={onAddManualPoint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Titik</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#121216] max-h-[500px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#0F0F12] text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/10 z-10">
            <tr>
              <th className="py-3 px-3">No. Titik</th>
              <th className="py-3 px-3">Sumber Data</th>
              <th className="py-3 px-3">Bujur Timur (BT / Long)</th>
              <th className="py-3 px-3">Lintang Selatan (LS / Lat)</th>
              <th className="py-3 px-3">Desimal (Lat, Long)</th>
              <th className="py-3 px-3">UTM (Zone / X / Y)</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-slate-200">
            {filteredPoints.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Belum ada data koordinat. Pilih sampel di atas atau unggah foto/scan.
                </td>
              </tr>
            ) : (
              filteredPoints.map((p) => {
                const isSelected = selectedPointId === p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPoint(p.id)}
                    className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : ''
                    }`}
                  >
                    {/* No Titik */}
                    <td className="py-2.5 px-3 font-mono font-medium text-white whitespace-nowrap">
                      Titik {p.pointNumber}
                    </td>

                    {/* Sumber Badge */}
                    <td className="py-2.5 px-3 max-w-[180px] truncate">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        p.sourceType === 'watermark_photo'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : p.sourceType === 'scanned_doc'
                          ? 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                          : p.sourceType === 'photocopy'
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {p.sourceName}
                      </span>
                    </td>

                    {/* BT DMS */}
                    <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {formatDMS(p.dmsLongitude)}
                    </td>

                    {/* LS DMS */}
                    <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {formatDMS(p.dmsLatitude)}
                    </td>

                    {/* Decimal */}
                    <td className="py-2.5 px-3 font-mono text-indigo-400 whitespace-nowrap">
                      {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}
                    </td>

                    {/* UTM */}
                    <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {p.utmZone || '50S'} | {p.utmEasting || '-'} mE | {p.utmNorthing || '-'} mN
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingPoint({ ...p })}
                          className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors"
                          title="Edit Titik"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePoint(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded transition-colors"
                          title="Hapus Titik"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Point Modal */}
      {editingPoint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F12] border border-white/10 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              Edit Titik Koordinat #{editingPoint.pointNumber}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nomor Titik</label>
                <input
                  type="text"
                  value={editingPoint.pointNumber}
                  onChange={(e) => setEditingPoint({ ...editingPoint, pointNumber: e.target.value })}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sumber Data</label>
                <input
                  type="text"
                  value={editingPoint.sourceName}
                  onChange={(e) => setEditingPoint({ ...editingPoint, sourceName: e.target.value })}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Latitude Desimal (°)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editingPoint.latitude}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value) || 0;
                    const dmsLat = decimalToDMS(lat, true);
                    const utm = latLongToUTM(lat, editingPoint.longitude);
                    setEditingPoint({
                      ...editingPoint,
                      latitude: lat,
                      dmsLatitude: dmsLat,
                      utmZone: utm.zone,
                      utmEasting: utm.easting,
                      utmNorthing: utm.northing
                    });
                  }}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-indigo-400 font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Longitude Desimal (°)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editingPoint.longitude}
                  onChange={(e) => {
                    const lon = parseFloat(e.target.value) || 0;
                    const dmsLon = decimalToDMS(lon, false);
                    const utm = latLongToUTM(editingPoint.latitude, lon);
                    setEditingPoint({
                      ...editingPoint,
                      longitude: lon,
                      dmsLongitude: dmsLon,
                      utmZone: utm.zone,
                      utmEasting: utm.easting,
                      utmNorthing: utm.northing
                    });
                  }}
                  className="w-full bg-[#121216] border border-white/10 rounded-lg p-2 text-indigo-400 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setEditingPoint(null)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-lg text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-lg shadow-indigo-600/20"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
