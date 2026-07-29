import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ExtractorUploadPanel } from './components/ExtractorUploadPanel';
import { CentralIntegratedTable } from './components/CentralIntegratedTable';
import { InteractiveMapView } from './components/InteractiveMapView';
import { ExportModal } from './components/ExportModal';
import { ALL_SAMPLE_DOCUMENTS } from './data/sampleData';
import { ExtractedDocument, CoordinatePoint } from './types';
import { decimalToDMS, latLongToUTM } from './utils/geo';
import { MapPin, Sparkles, Layers, FileSpreadsheet, Globe, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  // Start initialized with the 3 attached sample images pre-loaded and integrated into 1 centralized dataset!
  const [documents, setDocuments] = useState<ExtractedDocument[]>(ALL_SAMPLE_DOCUMENTS);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'table' | 'map' | 'combined'>('combined');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Flatten points from all documents into one integrated dataset
  const allPoints: CoordinatePoint[] = useMemo(() => {
    return documents.flatMap(doc => doc.points);
  }, [documents]);

  // Handler: Add extracted document
  const handleExtractDocument = (newDoc: ExtractedDocument) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  // Handler: Load all 3 sample documents together
  const handleLoadAllSamples = () => {
    setDocuments(ALL_SAMPLE_DOCUMENTS);
  };

  // Handler: Clear all data
  const handleClearAll = () => {
    setDocuments([]);
    setSelectedPointId(null);
  };

  // Handler: Update a single point
  const handleUpdatePoint = (updatedPoint: CoordinatePoint) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc => ({
        ...doc,
        points: doc.points.map(pt => (pt.id === updatedPoint.id ? updatedPoint : pt))
      }))
    );
  };

  // Handler: Delete point
  const handleDeletePoint = (id: string) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc => ({
        ...doc,
        points: doc.points.filter(pt => pt.id !== id)
      })).filter(doc => doc.points.length > 0)
    );
    if (selectedPointId === id) setSelectedPointId(null);
  };

  // Handler: Add manual point
  const handleAddManualPoint = () => {
    const nextNum = allPoints.length + 1;
    const defaultLat = -3.180000;
    const defaultLon = 115.990000;
    const dmsLat = decimalToDMS(defaultLat, true);
    const dmsLon = decimalToDMS(defaultLon, false);
    const utm = latLongToUTM(defaultLat, defaultLon);

    const newPoint: CoordinatePoint = {
      id: `manual-pt-${Date.now()}`,
      pointNumber: `${nextNum}`,
      sourceId: 'manual-input',
      sourceName: 'Input Manual',
      sourceType: 'manual',
      dmsLatitude: dmsLat,
      dmsLongitude: dmsLon,
      latitude: defaultLat,
      longitude: defaultLon,
      utmZone: utm.zone,
      utmEasting: utm.easting,
      utmNorthing: utm.northing,
      isValid: true,
    };

    if (documents.length === 0) {
      const manualDoc: ExtractedDocument = {
        id: `doc-manual-${Date.now()}`,
        title: 'Input Manual Koordinat',
        sourceType: 'manual',
        extractedAt: new Date().toISOString(),
        points: [newPoint]
      };
      setDocuments([manualDoc]);
    } else {
      setDocuments(prev => [
        {
          ...prev[0],
          points: [...prev[0].points, newPoint]
        },
        ...prev.slice(1)
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar */}
      <Navbar
        totalPoints={allPoints.length}
        totalDocuments={documents.length}
        onLoadAllSamples={handleLoadAllSamples}
        onClearAll={handleClearAll}
        onOpenExport={() => setIsExportOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Upload & Source Selection Panel */}
        <ExtractorUploadPanel
          onExtractDocument={handleExtractDocument}
          onExtractAllSamples={handleLoadAllSamples}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        {/* View Layouts */}
        {activeView === 'combined' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Column */}
            <div className="lg:col-span-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Peta Visualisasi Digital
                </h3>
                <span className="text-xs text-slate-400 font-mono">Leaflet GIS Engine</span>
              </div>
              <InteractiveMapView
                points={allPoints}
                selectedPointId={selectedPointId}
                onSelectPoint={setSelectedPointId}
              />
            </div>

            {/* Central Table Column */}
            <div className="lg:col-span-7">
              <CentralIntegratedTable
                documents={documents}
                allPoints={allPoints}
                onUpdatePoint={handleUpdatePoint}
                onDeletePoint={handleDeletePoint}
                onAddManualPoint={handleAddManualPoint}
                onClearAll={handleClearAll}
                selectedPointId={selectedPointId}
                onSelectPoint={setSelectedPointId}
              />
            </div>
          </div>
        )}

        {activeView === 'table' && (
          <CentralIntegratedTable
            documents={documents}
            allPoints={allPoints}
            onUpdatePoint={handleUpdatePoint}
            onDeletePoint={handleDeletePoint}
            onAddManualPoint={handleAddManualPoint}
            onClearAll={handleClearAll}
            selectedPointId={selectedPointId}
            onSelectPoint={setSelectedPointId}
          />
        )}

        {activeView === 'map' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Peta Visualisasi Batas Poligon Terpadu
              </h3>
              <span className="text-xs text-slate-400">Total {allPoints.length} Titik Koordinat</span>
            </div>
            <InteractiveMapView
              points={allPoints}
              selectedPointId={selectedPointId}
              onSelectPoint={setSelectedPointId}
            />
          </div>
        )}

      </main>

      {/* Export Options Modal */}
      <ExportModal
        documents={documents}
        points={allPoints}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0F0F12] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 GeoExtract AI • Sistem Ekstraksi & Integrasi Koordinat Multimodal</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-indigo-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Gemini Flash Engine
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
