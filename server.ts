import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Helper function to check if Gemini API key is valid
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

// Local fallback text coordinate parser
function parseCoordinatesLocalFallback(text: string) {
  const points: any[] = [];
  
  // 1. Match DMS coordinates e.g. 3°54'34"S 115°5'60"E
  const dmsRegex = /(?:titik|point|pt|no\.?)?\s*(\w+)?[:\s]*(\d+)[°\s]+(\d+)[`''\s]+([\d.]+)[`''"”\s]*([NSLSlu]+)[,\s]+(\d+)[°\s]+(\d+)[`''\s]+([\d.]+)[`''"”\s]*([EWBTbt]+)/gi;
  let match;
  let count = 1;

  while ((match = dmsRegex.exec(text)) !== null) {
    const ptNum = match[1] || `${count}`;
    const latDeg = parseInt(match[2], 10);
    const latMin = parseInt(match[3], 10);
    const latSec = parseFloat(match[4]);
    const latDirRaw = match[5].toUpperCase();
    const latDir = (latDirRaw.includes('S') || latDirRaw.includes('LS')) ? 'S' : 'N';

    const lonDeg = parseInt(match[6], 10);
    const lonMin = parseInt(match[7], 10);
    const lonSec = parseFloat(match[8]);
    const lonDirRaw = match[9].toUpperCase();
    const lonDir = (lonDirRaw.includes('W')) ? 'W' : 'E';

    let latDD = latDeg + latMin / 60 + latSec / 3600;
    if (latDir === 'S') latDD = -latDD;

    let lonDD = lonDeg + lonMin / 60 + lonSec / 3600;
    if (lonDir === 'W') lonDD = -lonDD;

    points.push({
      pointNumber: ptNum,
      dmsLongitude: { degrees: lonDeg, minutes: lonMin, seconds: lonSec, direction: lonDir },
      dmsLatitude: { degrees: latDeg, minutes: latMin, seconds: latSec, direction: latDir },
      latitude: Number(latDD.toFixed(6)),
      longitude: Number(lonDD.toFixed(6)),
      notes: 'Ekstraksi Parser Teks'
    });
    count++;
  }

  // 2. Match Decimal Lat, Long e.g. -3.178661, 115.986472
  if (points.length === 0) {
    const decimalRegex = /(-?\d+\.\d{4,})\s*,\s*(-?\d+\.\d{4,})/g;
    let decMatch;
    count = 1;
    while ((decMatch = decimalRegex.exec(text)) !== null) {
      let val1 = parseFloat(decMatch[1]);
      let val2 = parseFloat(decMatch[2]);
      let lat = val1;
      let lon = val2;

      // In Indonesia, lon is ~95 to ~141 E, lat is ~-11 to ~6
      if (val1 > 90 && val2 < 20) {
        lon = val1;
        lat = val2;
      }

      const isLat = lat >= 0 ? 'N' : 'S';
      const absLat = Math.abs(lat);
      const latD = Math.floor(absLat);
      const latMF = (absLat - latD) * 60;
      const latM = Math.floor(latMF);
      const latS = Number(((latMF - latM) * 60).toFixed(2));

      const isLon = lon >= 0 ? 'E' : 'W';
      const absLon = Math.abs(lon);
      const lonD = Math.floor(absLon);
      const lonMF = (absLon - lonD) * 60;
      const lonM = Math.floor(lonMF);
      const lonS = Number(((lonMF - lonM) * 60).toFixed(2));

      points.push({
        pointNumber: `${count}`,
        dmsLongitude: { degrees: lonD, minutes: lonM, seconds: lonS, direction: isLon },
        dmsLatitude: { degrees: latD, minutes: latM, seconds: latS, direction: isLat },
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lon.toFixed(6)),
        notes: 'Ekstraksi Desimal'
      });
      count++;
    }
  }

  return {
    title: 'Ekstraksi Teks Chat',
    points
  };
}

// API Endpoint for Coordinate Extraction
app.post('/api/extract-coordinates', upload.single('file'), async (req: Request, res: Response) => {
  const { sourceType, rawText, imageBase64, mimeType } = req.body;

  let ai: GoogleGenAI | null = null;
  let isApiKeyMissing = false;

  try {
    ai = getGeminiClient();
  } catch (err: any) {
    if (err.message === 'GEMINI_API_KEY_MISSING') {
      isApiKeyMissing = true;
    }
  }

  // Extract text from uploaded file if it's a text/csv/txt file
  let textToParse = rawText || '';
  if (req.file && (req.file.mimetype.startsWith('text/') || req.file.originalname.match(/\.(txt|csv|tsv|log)$/i))) {
    textToParse = req.file.buffer.toString('utf-8');
  }

  // If Gemini API key is missing, attempt local fallback text parser first
  if (isApiKeyMissing && textToParse) {
    const fallbackData = parseCoordinatesLocalFallback(textToParse);
    if (fallbackData.points.length > 0) {
      if (req.file) {
        fallbackData.title = req.file.originalname;
      }
      res.json({
        success: true,
        data: fallbackData,
        warning: 'Kunci API Gemini belum diatur. Menggunakan parser teks standar.'
      });
      return;
    }
  }

  if (isApiKeyMissing) {
    res.json({
      success: false,
      error: 'GEMINI_API_KEY belum dikonfigurasi. Silakan atur GEMINI_API_KEY di menu Settings (⚙️) -> Secrets pada AI Studio untuk memproses OCR gambar/foto.'
    });
    return;
  }

  try {
    let contents: any[] = [];

    const promptText = `
Anda adalah seorang ahli GIS, Pemetaan, dan Pengolahan Data Koordinat Indonesia.
Tugas Anda adalah mengekstrak seluruh data koordinat dari gambar/foto/dokumen/teks yang diberikan secara SANGAT AKURAT.

Format data yang sering ditemukan di Indonesia:
1. Bujur Timur (BT / Easting): Derajat (°), Menit ('), Detik (") atau Desimal. Direction: 'E'
2. Lintang Selatan (LS / Northing) atau Lintang Utara (LU): Derajat (°), Menit ('), Detik ("). Direction: 'S' atau 'N'
3. Watermark Foto Kamera (misal: "3°54'34"S 115°5'60"E Asri Mulia Jorong Tanah Laut Regency South Kalimantan")
4. Tabel SK IUP Pertambangan / BPN / Kehutanan (Kolom No. Titik, Bujur Timur BT, Lintang Selatan LS).

PETUNJUK EKSTRAKSI DOKUMEN/GAMBAR:
- Ekstrak Judul Dokumen (title), Nomor Surat/SK jika ada, Tanggal jika ada, Perusahaan/Pemilik, Komoditas, Luas (Ha), serta Lokasi (Provinsi, Kabupaten, Kecamatan).
- Untuk setiap baris titik koordinat:
  * pointNumber: nomor/label titik (contoh "1", "25", "Titik A", "P-01").
  * dmsLongitude: degrees (angka), minutes (angka), seconds (angka desimal), direction ('E' atau 'W').
  * dmsLatitude: degrees (angka), minutes (angka), seconds (angka desimal), direction ('S' atau 'N').
  * latitude: nilai desimal derajat latitude (negatif jika S, positif jika N). Contoh: -3.178661
  * longitude: nilai desimal derajat longitude (posiif jika E). Contoh: 115.986472
  * notes: catatan khusus jika ada.

Harap kembalikan JSON persis sesuai dengan schema berikut.
`;

    if (req.file) {
      const fileBase64 = req.file.buffer.toString('base64');
      const fileMime = req.file.mimetype || 'image/jpeg';
      contents = [
        {
          inlineData: {
            mimeType: fileMime,
            data: fileBase64
          }
        },
        { text: promptText }
      ];
    } else if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents = [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64
          }
        },
        { text: promptText }
      ];
    } else if (rawText) {
      contents = [
        { text: `${promptText}\n\nBERIKUT TEKS RAW CHAT / DOKUMEN UNTUK DIESKTRAK:\n${rawText}` }
      ];
    } else {
      res.status(400).json({ success: false, error: 'Silakan unggah berkas foto/dokumen atau masukkan teks koordinat.' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Judul dokumen atau deskripsi foto' },
            documentNumber: { type: Type.STRING, description: 'Nomor SK/Dokumen jika ada' },
            date: { type: Type.STRING, description: 'Tanggal dokumen / foto (YYYY-MM-DD)' },
            company: { type: Type.STRING, description: 'Nama Perusahaan / Pemilik / Instansi' },
            commodity: { type: Type.STRING, description: 'Komoditas tambang / jenis penggunaan lahan' },
            areaHa: { type: Type.NUMBER, description: 'Luas wilayah dalam Hektar (Ha)' },
            location: {
              type: Type.OBJECT,
              properties: {
                province: { type: Type.STRING },
                regency: { type: Type.STRING },
                district: { type: Type.STRING }
              }
            },
            points: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pointNumber: { type: Type.STRING },
                  dmsLongitude: {
                    type: Type.OBJECT,
                    properties: {
                      degrees: { type: Type.NUMBER },
                      minutes: { type: Type.NUMBER },
                      seconds: { type: Type.NUMBER },
                      direction: { type: Type.STRING, description: "'E' or 'W'" }
                    },
                    required: ['degrees', 'minutes', 'seconds', 'direction']
                  },
                  dmsLatitude: {
                    type: Type.OBJECT,
                    properties: {
                      degrees: { type: Type.NUMBER },
                      minutes: { type: Type.NUMBER },
                      seconds: { type: Type.NUMBER },
                      direction: { type: Type.STRING, description: "'N' or 'S'" }
                    },
                    required: ['degrees', 'minutes', 'seconds', 'direction']
                  },
                  latitude: { type: Type.NUMBER, description: 'Desimal Latitude (-90 s/d 90)' },
                  longitude: { type: Type.NUMBER, description: 'Desimal Longitude (-180 s/d 180)' },
                  notes: { type: Type.STRING }
                },
                required: ['pointNumber', 'dmsLongitude', 'dmsLatitude', 'latitude', 'longitude']
              }
            }
          },
          required: ['title', 'points']
        }
      }
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);

    res.json({
      success: true,
      data: parsed
    });
  } catch (error: any) {
    console.error('Extraction Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal mengekstrak data koordinat.'
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite Development or Production Static Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Resolve dist folder dynamically from __dirname or process.cwd()
    let distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
      distPath = __dirname;
    } else if (!fs.existsSync(distPath) && fs.existsSync(path.join(__dirname, '../dist'))) {
      distPath = path.join(__dirname, '../dist');
    }

    console.log(`[Production] Serving static assets from: ${distPath}`);

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build error: index.html not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server GeoExtract running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
