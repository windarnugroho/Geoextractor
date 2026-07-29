import { CoordinatePoint, DMSCoordinate } from '../types';

/**
 * Converts DMS (Degrees, Minutes, Seconds, Direction) to Decimal Degrees
 */
export function dmsToDecimal(dms: DMSCoordinate): number {
  const { degrees, minutes, seconds, direction } = dms;
  let dd = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = -dd;
  }
  return Number(dd.toFixed(6));
}

/**
 * Converts Decimal Degrees to DMS format
 */
export function decimalToDMS(decimal: number, isLatitude: boolean): DMSCoordinate {
  const direction = isLatitude 
    ? (decimal >= 0 ? 'N' : 'S') 
    : (decimal >= 0 ? 'E' : 'W');
  
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesFull = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = Number(((minutesFull - minutes) * 60).toFixed(2));

  return {
    degrees,
    minutes,
    seconds,
    direction
  };
}

/**
 * Formats DMS to string e.g. 115° 59' 11.44" E
 */
export function formatDMS(dms: DMSCoordinate): string {
  if (!dms) return '-';
  const secStr = dms.seconds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${dms.degrees}° ${dms.minutes}' ${secStr}" ${dms.direction}`;
}

/**
 * Calculates approximate UTM coordinates (Zone and Easting/Northing) from Lat/Long
 */
export function latLongToUTM(lat: number, lon: number): { zone: string; easting: number; northing: number } {
  const zoneNum = Math.floor((lon + 180) / 6) + 1;
  const isSouth = lat < 0;
  const zoneLetter = isSouth ? 'S' : 'N';
  const zone = `${zoneNum}${zoneLetter}`;

  // Simplified Mercator UTM approximation for fast local calculation
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const centralMeridian = ((zoneNum - 1) * 6 - 180 + 3) * (Math.PI / 180);

  const k0 = 0.9996;
  const a = 6378137; // WGS84 major axis
  const e2 = 0.00669438; // WGS84 eccentricity squared

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = (e2 / (1 - e2)) * Math.cos(latRad) * Math.cos(latRad);
  const A = (lonRad - centralMeridian) * Math.cos(latRad);

  const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad
    - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad)
    + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad)
    - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad));

  const easting = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * e2) * Math.pow(A, 5) / 120) + 500000;
  let northing = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * e2) * Math.pow(A, 6) / 720));
  if (isSouth) {
    northing += 10000000;
  }

  return {
    zone,
    easting: Math.round(easting),
    northing: Math.round(northing)
  };
}

/**
 * Calculates geodesic area in hectares for a closed polygon of points
 */
export function calculatePolygonAreaHa(points: CoordinatePoint[]): number {
  if (points.length < 3) return 0;

  const R = 6378137; // Earth radius in meters
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];

    const lat1Rad = (p1.latitude * Math.PI) / 180;
    const lat2Rad = (p2.latitude * Math.PI) / 180;
    const lon1Rad = (p1.longitude * Math.PI) / 180;
    const lon2Rad = (p2.longitude * Math.PI) / 180;

    area += (lon2Rad - lon1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
  }

  area = (Math.abs(area) * R * R) / 2; // SQ meters
  return Number((area / 10000).toFixed(2)); // convert to Hectares (Ha)
}

/**
 * Calculates perimeter in km
 */
export function calculatePerimeterKm(points: CoordinatePoint[]): number {
  if (points.length < 2) return 0;
  let totalMeters = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];

    const R = 6371000; // Earth radius
    const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.latitude * Math.PI) / 180) *
        Math.cos((p2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalMeters += R * c;
  }

  return Number((totalMeters / 1000).toFixed(2));
}

/**
 * Generate CSV string from points
 */
export function generateCSV(points: CoordinatePoint[]): string {
  const headers = [
    'No Titik',
    'Sumber Data',
    'Tipe Sumber',
    'Bujur Timur (BT DMS)',
    'Lintang Selatan/Utara (LS/LU DMS)',
    'Latitude (Decimal)',
    'Longitude (Decimal)',
    'UTM Zone',
    'UTM Easting (X)',
    'UTM Northing (Y)',
    'Catatan / Notes'
  ];

  const rows = points.map(p => [
    `"${p.pointNumber}"`,
    `"${p.sourceName}"`,
    `"${p.sourceType}"`,
    `"${formatDMS(p.dmsLongitude)}"`,
    `"${formatDMS(p.dmsLatitude)}"`,
    p.latitude,
    p.longitude,
    `"${p.utmZone || ''}"`,
    p.utmEasting || '',
    p.utmNorthing || '',
    `"${p.notes || ''}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generate GeoJSON string from points
 */
export function generateGeoJSON(points: CoordinatePoint[], title = 'Koordinat Terintegrasi'): string {
  const featureCollection = {
    type: 'FeatureCollection',
    name: title,
    features: [
      // LineString / Polygon if 3 or more points
      ...(points.length >= 3 ? [{
        type: 'Feature',
        properties: {
          name: `${title} Boundary Polygon`,
          pointCount: points.length,
          areaHa: calculatePolygonAreaHa(points),
          perimeterKm: calculatePerimeterKm(points)
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [...points.map(p => [p.longitude, p.latitude]), [points[0].longitude, points[0].latitude]]
          ]
        }
      }] : []),
      // Point features
      ...points.map(p => ({
        type: 'Feature',
        properties: {
          id: p.id,
          pointNumber: p.pointNumber,
          sourceName: p.sourceName,
          dmsLongitude: formatDMS(p.dmsLongitude),
          dmsLatitude: formatDMS(p.dmsLatitude),
          latitude: p.latitude,
          longitude: p.longitude,
          utmZone: p.utmZone,
          utmEasting: p.utmEasting,
          utmNorthing: p.utmNorthing,
          notes: p.notes
        },
        geometry: {
          type: 'Point',
          coordinates: [p.longitude, p.latitude]
        }
      }))
    ]
  };

  return JSON.stringify(featureCollection, null, 2);
}

/**
 * Generate KML string for Google Earth
 */
export function generateKML(points: CoordinatePoint[], title = 'Koordinat Terintegrasi'): string {
  const pointPlacemarks = points.map(p => `
    <Placemark>
      <name>Titik ${p.pointNumber}</name>
      <description><![CDATA[
        <b>Sumber:</b> ${p.sourceName}<br/>
        <b>BT DMS:</b> ${formatDMS(p.dmsLongitude)}<br/>
        <b>LS DMS:</b> ${formatDMS(p.dmsLatitude)}<br/>
        <b>Lat, Long:</b> ${p.latitude}, ${p.longitude}<br/>
        <b>UTM:</b> ${p.utmZone || ''} X:${p.utmEasting || ''} Y:${p.utmNorthing || ''}
      ]]></description>
      <Point>
        <coordinates>${p.longitude},${p.latitude},0</coordinates>
      </Point>
    </Placemark>`).join('');

  let polygonPlacemark = '';
  if (points.length >= 3) {
    const coordsStr = [...points, points[0]]
      .map(p => `${p.longitude},${p.latitude},0`)
      .join(' ');

    polygonPlacemark = `
    <Placemark>
      <name>Batas Wilayah ${title}</name>
      <Style>
        <LineStyle><color>ff0000ff</color><width>3</width></LineStyle>
        <PolyStyle><color>400000ff</color></PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordsStr}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${title}</name>
    <description>Hasil Ekstraksi Data Koordinat Terintegrasi</description>
    ${polygonPlacemark}
    ${pointPlacemarks}
  </Document>
</kml>`;
}
