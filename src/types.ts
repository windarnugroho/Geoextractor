export type SourceType = 'watermark_photo' | 'scanned_doc' | 'photocopy' | 'chat_text' | 'manual';

export interface DMSCoordinate {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: 'N' | 'S' | 'E' | 'W';
}

export interface CoordinatePoint {
  id: string;
  pointNumber: string; // e.g. "1", "25", "Titik 1"
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  dmsLongitude: DMSCoordinate;
  dmsLatitude: DMSCoordinate;
  latitude: number;  // Decimal degrees (e.g. -3.178661)
  longitude: number; // Decimal degrees (e.g. 115.986472)
  utmZone?: string;   // e.g. "50S"
  utmEasting?: number;
  utmNorthing?: number;
  notes?: string;
  timestamp?: string;
  isValid?: boolean;
  validationError?: string;
}

export interface ExtractedDocument {
  id: string;
  title: string;
  sourceType: SourceType;
  documentNumber?: string;
  date?: string;
  location?: {
    province?: string;
    regency?: string;
    district?: string;
  };
  company?: string;
  commodity?: string;
  areaHa?: number;
  extractedAt: string;
  points: CoordinatePoint[];
  rawText?: string;
  imageUrl?: string;
}

export interface ExtractionResponse {
  success: boolean;
  document?: ExtractedDocument;
  error?: string;
}

export interface MapLayerConfig {
  showMarkers: boolean;
  showPolygons: boolean;
  showLabels: boolean;
  showUTM: boolean;
  tileProvider: 'osm' | 'satellite';
}
