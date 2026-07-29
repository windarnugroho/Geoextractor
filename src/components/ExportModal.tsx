import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { CoordinatePoint, ExtractedDocument } from '../types';
import { generateCSV, generateGeoJSON, generateKML, formatDMS, calculatePolygonAreaHa, calculatePerimeterKm } from '../utils/geo';
import { Download, FileSpreadsheet, Globe, FileText, X, Check, Copy } from 'lucide-react';

interface ExportModalProps {
  documents: ExtractedDocument[];
  points: CoordinatePoint[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  documents,
  points,
  isOpen,
  onClose,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const areaHa = calculatePolygonAreaHa(points);
  const perimeterKm = calculatePerimeterKm(points);

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    // Data sheet rows
    const dataRows = points.map(p => ({
      'No. Titik': p.pointNumber,
      'Sumber Data': p.sourceName,
      'Bujur Timur (BT / Longitude DMS)': formatDMS(p.dmsLongitude),
      'Lintang Selatan (LS / Latitude DMS)': formatDMS(p.dmsLatitude),
      'Latitude (Desimal)': p.latitude,
      'Longitude (Desimal)': p.longitude,
      'UTM Zone': p.utmZone || '50S',
      'UTM Easting X (m)': p.utmEasting || '',
      'UTM Northing Y (m)': p.utmNorthing || '',
      'Catatan': p.notes || ''
    }));

    // Summary sheet rows
    const summaryRows = [
      { Parameter: 'Judul Proyek / Integrasi', Nilai: 'Data Koordinat Terpadu Multi-Sumber' },
      { Parameter: 'Total Titik Koordinat', Nilai: points.length },
      { Parameter: 'Jumlah Berkas Sumber', Nilai: documents.length },
      { Parameter: 'Estimasi Luas Area (Ha)', Nilai: areaHa > 0 ? `${areaHa} Hektar` : '-' },
      { Parameter: 'Keliling Batas Wilayah (km)', Nilai: perimeterKm > 0 ? `${perimeterKm} km` : '-' },
      { Parameter: 'Tanggal Ekstraksi', Nilai: new Date().toLocaleDateString('id-ID') },
    ];

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(dataRows);
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

    XLSX.utils.book_append_sheet(wb, wsData, 'Data Koordinat Terpadu');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Wilayah');

    XLSX.writeFile(wb, `Data_Koordinat_Terpadu_GeoExtract_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = generateCSV(points);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Koordinat_GeoExtract_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export GeoJSON
  const handleExportGeoJSON = () => {
    const geojsonStr = generateGeoJSON(points, 'Batas_Wilayah_Terpadu');
    const blob = new Blob([geojsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Koordinat_GIS_${new Date().toISOString().split('T')[0]}.geojson`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export KML (Google Earth)
  const handleExportKML = () => {
    const kmlStr = generateKML(points, 'Batas_Wilayah_Terpadu');
    const blob = new Blob([kmlStr], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Koordinat_GoogleEarth_${new Date().toISOString().split('T')[0]}.kml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F0F12] border border-white/10 rounded-xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Ekspor Data Koordinat</h3>
              <p className="text-xs text-slate-400">Pilih format berkas spreadsheet atau peta digital yang diinginkan</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Excel .xlsx */}
          <button
            onClick={handleExportExcel}
            className="p-4 bg-[#121216] hover:bg-white/[0.04] border border-white/10 hover:border-indigo-500/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/20">
                Rekomendasi
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300">Spreadsheet Excel (.xlsx)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Lengkap dengan tab data koordinat & ringkasan wilayah</p>
            </div>
          </button>

          {/* CSV File */}
          <button
            onClick={handleExportCSV}
            className="p-4 bg-[#121216] hover:bg-white/[0.04] border border-white/10 hover:border-teal-500/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="p-2 bg-teal-500/20 text-teal-400 rounded-lg group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-teal-300">Berkas CSV (.csv)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Format standar tabel UTF-8 untuk Excel & QGIS</p>
            </div>
          </button>

          {/* GeoJSON */}
          <button
            onClick={handleExportGeoJSON}
            className="p-4 bg-[#121216] hover:bg-white/[0.04] border border-white/10 hover:border-indigo-500/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5" />
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300">GeoJSON (.geojson)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Vektor GIS untuk QGIS, ArcGIS, dan Leaflet Web Map</p>
            </div>
          </button>

          {/* KML Google Earth */}
          <button
            onClick={handleExportKML}
            className="p-4 bg-[#121216] hover:bg-white/[0.04] border border-white/10 hover:border-amber-500/50 rounded-lg text-left transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5" />
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white group-hover:text-amber-300">KML Google Earth (.kml)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Visualisasi batas poligon di Google Earth Mobile/Desktop</p>
            </div>
          </button>

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-medium text-xs rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
