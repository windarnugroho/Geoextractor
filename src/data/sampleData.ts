import { ExtractedDocument, CoordinatePoint } from '../types';
import { dmsToDecimal, latLongToUTM } from '../utils/geo';

// Sample 1: Watermarked Camera Photo
export const sampleDocument1: ExtractedDocument = {
  id: 'doc-sample-1',
  title: 'Foto GPS Watermark Camera - Jorong, Tanah Laut',
  sourceType: 'watermark_photo',
  documentNumber: 'GPS-CAM-20260602-001',
  date: '2026-06-02',
  location: {
    province: 'Kalimantan Selatan',
    regency: 'Tanah Laut',
    district: 'Jorong'
  },
  company: 'Foto Lapangan Survei (Asri Mulia)',
  commodity: 'Titik Lokasi Lapangan',
  extractedAt: '2026-07-29T00:33:00.000Z',
  rawText: 'Jun 2, 2026 9:40:55 AM\n3°54\'34"S 115°5\'60"E\nAsri Mulia Jorong\nTanah Laut Regency\nSouth Kalimantan',
  imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?auto=format&fit=crop&w=800&q=80', // sample representation
  points: [
    createPoint('pt-w1', '1', 'Foto Watermark Camera (Jorong)', 'watermark_photo', 115, 5, 60, 'E', 3, 54, 34, 'S', 'Titik foto survei lokasi Asri Mulia, Jorong')
  ]
};

// Sample 2: Scanned Document Hal 2 (Titik 25 - 44)
export const sampleDocument2: ExtractedDocument = {
  id: 'doc-sample-2',
  title: 'Fotokopi Tabel Koordinat IUP Kotabaru (Titik 25 - 44)',
  sourceType: 'photocopy',
  documentNumber: 'SK IUP Kotabaru (Hal 2)',
  date: '2014-09-29',
  location: {
    province: 'Kalimantan Selatan',
    regency: 'Kotabaru',
    district: 'Kelumpang Hilir'
  },
  company: 'PT. TUNGGAL UTAMALESTARI',
  commodity: 'Batubara',
  extractedAt: '2026-07-29T00:33:05.000Z',
  rawText: 'BUPATI KOTABARU - H. IRHAMI RIDJANI\nDaftar Koordinat Titik 25 s/d 44',
  imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80',
  points: [
    createPoint('pt-25', '25', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 11.44, 'E', 3, 12, 2.34, 'S'),
    createPoint('pt-26', '26', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 59.97, 'E', 3, 12, 2.34, 'S'),
    createPoint('pt-27', '27', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 59.97, 'E', 3, 11, 33.77, 'S'),
    createPoint('pt-28', '28', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 54.73, 'E', 3, 11, 33.77, 'S'),
    createPoint('pt-29', '29', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 54.73, 'E', 3, 11, 30.67, 'S'),
    createPoint('pt-30', '30', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 48.63, 'E', 3, 11, 30.67, 'S'),
    createPoint('pt-31', '31', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 48.63, 'E', 3, 11, 27.73, 'S'),
    createPoint('pt-32', '32', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 44.02, 'E', 3, 11, 27.73, 'S'),
    createPoint('pt-33', '33', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 44.02, 'E', 3, 11, 24.98, 'S'),
    createPoint('pt-34', '34', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 38.46, 'E', 3, 11, 24.98, 'S'),
    createPoint('pt-35', '35', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 38.46, 'E', 3, 11, 22.47, 'S'),
    createPoint('pt-36', '36', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 33.47, 'E', 3, 11, 22.47, 'S'),
    createPoint('pt-37', '37', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 33.47, 'E', 3, 11, 19.80, 'S'),
    createPoint('pt-38', '38', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 29.09, 'E', 3, 11, 19.80, 'S'),
    createPoint('pt-39', '39', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 29.09, 'E', 3, 11, 17.73, 'S'),
    createPoint('pt-40', '40', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 23.59, 'E', 3, 11, 17.73, 'S'),
    createPoint('pt-41', '41', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 23.59, 'E', 3, 11, 14.74, 'S'),
    createPoint('pt-42', '42', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 18.41, 'E', 3, 11, 14.74, 'S'),
    createPoint('pt-43', '43', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 18.41, 'E', 3, 11, 12.02, 'S'),
    createPoint('pt-44', '44', 'Fotokopi IUP Kotabaru Hal 2', 'photocopy', 115, 59, 11.44, 'E', 3, 11, 14.02, 'S')
  ]
};

// Sample 3: Scanned SK IUP Kotabaru PT. Tunggal Utamalestari Hal 1 (Titik 1 - 24)
export const sampleDocument3: ExtractedDocument = {
  id: 'doc-sample-3',
  title: 'Scan SK IUP OP PT. Tunggal Utamalestari (Titik 1 - 24)',
  sourceType: 'scanned_doc',
  documentNumber: '545/18/IUPOP/D.PE/2014',
  date: '2014-09-29',
  location: {
    province: 'Kalimantan Selatan',
    regency: 'Kotabaru',
    district: 'Kelumpang Hilir'
  },
  company: 'PT. TUNGGAL UTAMALESTARI',
  commodity: 'Batubara',
  areaHa: 1294.9,
  extractedAt: '2026-07-29T00:33:10.000Z',
  rawText: 'LAMPIRAN I KEPUTUSAN BUPATI KOTABARU NOMOR : 545/18/IUPOP/D.PE/2014 TANGGAL : 29 September 2014 TENTANG : PERSETUJUAN PERPANJANGAN PERTAMA IUP OPERASI PRODUKSI KEPADA PT. TUNGGAL UTAMALESTARI',
  imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
  points: [
    createPoint('pt-1', '1', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 11.30, 'E', 3, 10, 43.18, 'S'),
    createPoint('pt-2', '2', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 16.56, 'E', 3, 10, 43.18, 'S'),
    createPoint('pt-3', '3', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 16.56, 'E', 3, 10, 45.90, 'S'),
    createPoint('pt-4', '4', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 21.52, 'E', 3, 10, 45.90, 'S'),
    createPoint('pt-5', '5', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 21.52, 'E', 3, 10, 49.08, 'S'),
    createPoint('pt-6', '6', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 26.43, 'E', 3, 10, 49.08, 'S'),
    createPoint('pt-7', '7', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 26.43, 'E', 3, 10, 51.79, 'S'),
    createPoint('pt-8', '8', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 31.09, 'E', 3, 10, 51.79, 'S'),
    createPoint('pt-9', '9', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 31.09, 'E', 3, 10, 54.72, 'S'),
    createPoint('pt-10', '10', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 34.80, 'E', 3, 10, 54.72, 'S'),
    createPoint('pt-11', '11', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 34.80, 'E', 3, 10, 57.44, 'S'),
    createPoint('pt-12', '12', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 38.64, 'E', 3, 10, 57.44, 'S'),
    createPoint('pt-13', '13', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 38.64, 'E', 3, 10, 59.75, 'S'),
    createPoint('pt-14', '14', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 42.66, 'E', 3, 10, 59.75, 'S'),
    createPoint('pt-15', '15', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 42.66, 'E', 3, 11, 1.97, 'S'),
    createPoint('pt-16', '16', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 46.95, 'E', 3, 11, 1.97, 'S'),
    createPoint('pt-17', '17', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 46.95, 'E', 3, 11, 4.48, 'S'),
    createPoint('pt-18', '18', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 50.61, 'E', 3, 11, 4.48, 'S'),
    createPoint('pt-19', '19', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 50.61, 'E', 3, 11, 6.89, 'S'),
    createPoint('pt-20', '20', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 54.82, 'E', 3, 11, 6.89, 'S'),
    createPoint('pt-21', '21', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 54.82, 'E', 3, 11, 9.53, 'S'),
    createPoint('pt-22', '22', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 59.96, 'E', 3, 11, 9.53, 'S'),
    createPoint('pt-23', '23', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 59.96, 'E', 3, 6, 57.05, 'S'),
    createPoint('pt-24', '24', 'SK IUP PT Tunggal Utamalestari Hal 1', 'scanned_doc', 115, 59, 11.30, 'E', 3, 6, 57.05, 'S')
  ]
};

// Helper function to create point
function createPoint(
  id: string,
  pointNumber: string,
  sourceName: string,
  sourceType: any,
  lonD: number, lonM: number, lonS: number, lonDir: 'E'|'W',
  latD: number, latM: number, latS: number, latDir: 'N'|'S',
  notes = ''
): CoordinatePoint {
  const dmsLon = { degrees: lonD, minutes: lonM, seconds: lonS, direction: lonDir };
  const dmsLat = { degrees: latD, minutes: latM, seconds: latS, direction: latDir };
  const longitude = dmsToDecimal(dmsLon);
  const latitude = dmsToDecimal(dmsLat);
  const utm = latLongToUTM(latitude, longitude);

  return {
    id,
    pointNumber,
    sourceId: `source-${sourceType}`,
    sourceName,
    sourceType,
    dmsLongitude: dmsLon,
    dmsLatitude: dmsLat,
    longitude,
    latitude,
    utmZone: utm.zone,
    utmEasting: utm.easting,
    utmNorthing: utm.northing,
    notes,
    isValid: true
  };
}

export const ALL_SAMPLE_DOCUMENTS = [
  sampleDocument3,
  sampleDocument2,
  sampleDocument1
];
