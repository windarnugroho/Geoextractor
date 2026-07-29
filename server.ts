import express, { Request, Response } from 'express';
import path from 'path';
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

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
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

// API Endpoint for Coordinate Extraction
app.post('/api/extract-coordinates', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    const { sourceType, rawText, imageBase64, mimeType } = req.body;

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
      model: 'gemini-3.6-flash',
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server GeoExtract running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
