import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CoordinatePoint } from '../types';
import { formatDMS } from '../utils/geo';
import { Globe, Layers, Maximize2, MapPin, Info } from 'lucide-react';

interface InteractiveMapViewProps {
  points: CoordinatePoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const polygonRef = useRef<L.Polygon | null>(null);

  const [tileLayerType, setTileLayerType] = useState<'osm' | 'satellite'>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize and Update Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map container is already initialized by leaflet
    const container = mapContainerRef.current as any;
    if (container._leaflet_id && !mapInstanceRef.current) {
      container._leaflet_id = null;
    }

    // Create Map Instance if not created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-3.18, 115.99], 13); // Default view over Kotabaru / Tanah Laut

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add selected Tile Layer
    if (tileLayerType === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
      }).addTo(map);
      // Add labels overlay
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
    }

    // Clear existing markers & polygons
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (points.length === 0) return;

    // Draw Markers
    const bounds = L.latLngBounds([]);

    points.forEach((p) => {
      const latLng: [number, number] = [p.latitude, p.longitude];
      bounds.extend(latLng);

      const isSelected = p.id === selectedPointId;

      // Color coding by source
      const badgeColor = p.sourceType === 'watermark_photo' ? '#f59e0b' : '#10b981';

      // Custom DivIcon marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: ${isSelected ? '#6366f1' : badgeColor};
            color: #ffffff;
            font-weight: 800;
            font-size: 10px;
            padding: 3px 7px;
            border-radius: 9999px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
            transform: translate(-50%, -100%);
            display: flex;
            align-items: center;
            gap: 2px;
          ">
            <span>T-${p.pointNumber}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(latLng, { icon: customIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
          <div style="font-weight: 800; font-size: 13px; color: #4f46e5; margin-bottom: 2px;">
            Titik Koordinat #${p.pointNumber}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            ${p.sourceName}
          </div>
          <div style="font-size: 11px; font-family: monospace; background: #f1f5f9; padding: 6px; border-radius: 6px; margin-bottom: 4px;">
            <b>BT (DMS):</b> ${formatDMS(p.dmsLongitude)}<br/>
            <b>LS (DMS):</b> ${formatDMS(p.dmsLatitude)}<br/>
            <b>Desimal:</b> ${p.latitude}, ${p.longitude}<br/>
            <b>UTM:</b> ${p.utmZone || '50S'} ${p.utmEasting || ''} X, ${p.utmNorthing || ''} Y
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectPoint(p.id);
      });

      markersRef.current[p.id] = marker;
    });

    // Draw Boundary Polygon if points >= 3
    if (points.length >= 3) {
      const polygonCoords = points.map((p) => [p.latitude, p.longitude] as [number, number]);
      const polygon = L.polygon(polygonCoords, {
        color: '#6366f1',
        weight: 3,
        fillColor: '#6366f1',
        fillOpacity: 0.25,
        dashArray: '6, 6',
      }).addTo(map);

      polygonRef.current = polygon;
    }

    // Auto Fit Bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [points, tileLayerType]);

  // Clean up map instance only when component unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Open popup when selectedPointId changes
  useEffect(() => {
    if (selectedPointId && markersRef.current[selectedPointId]) {
      const marker = markersRef.current[selectedPointId];
      marker.openPopup();
    }
  }, [selectedPointId]);

  return (
    <div className={`relative bg-[#0F0F12] border border-white/10 rounded-xl overflow-hidden shadow-2xl ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-xl' : 'h-[500px]'
    }`}>
      
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-[#09090B]" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-[#0F0F12]/90 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg flex items-center gap-1">
          <button
            onClick={() => setTileLayerType('satellite')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              tileLayerType === 'satellite'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Satelit Esri
          </button>
          <button
            onClick={() => setTileLayerType('osm')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              tileLayerType === 'osm'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Peta Vektor OSM
          </button>
        </div>
      </div>

      {/* Top Right Fullscreen Toggle */}
      <div className="absolute top-4 right-14 z-[1000]">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-[#0F0F12]/90 backdrop-blur-md hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 shadow-lg transition-all"
          title={isFullscreen ? 'Kecilkan Peta' : 'Layar Penuh'}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0F0F12]/90 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-lg text-xs text-slate-200 max-w-xs hidden sm:block">
        <div className="flex items-center gap-2 font-semibold text-white mb-1.5">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Visualisasi Batas Wilayah (GIS)</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
            <span>Titik Batas Dokumen IUP / Scan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
            <span>Foto Watermark GPS Lapangan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-indigo-400 border-t border-dashed border-indigo-400" />
            <span>Garis Poligon IUP Mining Block</span>
          </div>
        </div>
      </div>

    </div>
  );
};
