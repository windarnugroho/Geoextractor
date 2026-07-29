import React, { useState } from 'react';
import { Upload, MessageSquareText, Image as ImageIcon, Sparkles, Loader2, CheckCircle2, AlertCircle, FileText, Camera, Table } from 'lucide-react';
import { ALL_SAMPLE_DOCUMENTS } from '../data/sampleData';
import { ExtractedDocument } from '../types';

interface ExtractorUploadPanelProps {
  onExtractDocument: (doc: ExtractedDocument) => void;
  onExtractAllSamples: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const ExtractorUploadPanel: React.FC<ExtractorUploadPanelProps> = ({
  onExtractDocument,
  onExtractAllSamples,
  isLoading,
  setIsLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'samples'>('samples');
  const [chatText, setChatText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedSuccess, setExtractedSuccess] = useState<string | null>(null);

  // File Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setErrorMsg(null);
    setExtractedSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-coordinates', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Gagal mengekstrak koordinat dari berkas.');
      }

      const extractedData = result.data;
      const imageUrl = URL.createObjectURL(file);

      // Construct document object
      const newDoc: ExtractedDocument = {
        id: `doc-${Date.now()}`,
        title: extractedData.title || file.name,
        sourceType: file.name.toLowerCase().includes('watermark') ? 'watermark_photo' : 'scanned_doc',
        documentNumber: extractedData.documentNumber,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        location: extractedData.location,
        company: extractedData.company,
        commodity: extractedData.commodity,
        areaHa: extractedData.areaHa,
        extractedAt: new Date().toISOString(),
        imageUrl,
        points: (extractedData.points || []).map((p: any, idx: number) => ({
          id: `pt-${Date.now()}-${idx}`,
          pointNumber: p.pointNumber || `${idx + 1}`,
          sourceId: `source-${Date.now()}`,
          sourceName: extractedData.title || file.name,
          sourceType: 'scanned_doc',
          dmsLongitude: p.dmsLongitude,
          dmsLatitude: p.dmsLatitude,
          latitude: p.latitude,
          longitude: p.longitude,
          notes: p.notes,
          isValid: true,
        })),
      };

      onExtractDocument(newDoc);
      setExtractedSuccess(`Berhasil mengekstrak ${newDoc.points.length} titik koordinat dari ${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chat Text Handler
  const handleChatExtract = async () => {
    if (!chatText.trim()) {
      setErrorMsg('Masukkan teks koordinat terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setExtractedSuccess(null);

    try {
      const response = await fetch('/api/extract-coordinates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: chatText }),
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Gagal mengekstrak koordinat dari teks chat.');
      }

      const extractedData = result.data;

      const newDoc: ExtractedDocument = {
        id: `doc-chat-${Date.now()}`,
        title: extractedData.title || 'Ekstraksi Teks Chat',
        sourceType: 'chat_text',
        documentNumber: extractedData.documentNumber,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        location: extractedData.location,
        company: extractedData.company,
        extractedAt: new Date().toISOString(),
        rawText: chatText,
        points: (extractedData.points || []).map((p: any, idx: number) => ({
          id: `pt-chat-${Date.now()}-${idx}`,
          pointNumber: p.pointNumber || `${idx + 1}`,
          sourceId: `source-chat-${Date.now()}`,
          sourceName: 'Teks Chat WhatsApp/Telegram',
          sourceType: 'chat_text',
          dmsLongitude: p.dmsLongitude,
          dmsLatitude: p.dmsLatitude,
          latitude: p.latitude,
          longitude: p.longitude,
          notes: p.notes,
          isValid: true,
        })),
      };

      onExtractDocument(newDoc);
      setExtractedSuccess(`Berhasil mengekstrak ${newDoc.points.length} titik dari teks chat.`);
      setChatText('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengekstrak teks chat.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0F0F12] rounded-xl border border-white/10 p-5 shadow-2xl">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Pilih Sumber Data Koordinat
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mendukung Foto Watermark, Table Scan/Fotokopi, Teks Chat WA, & 3 Foto Terlampir
          </p>
        </div>

        <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'samples'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            3 Sampel Terlampir
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Unggah Foto / Scan
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            Teks Chat / Raw
          </button>
        </div>
      </div>

      {/* Tab 1: 3 Pre-loaded Samples */}
      {activeTab === 'samples' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-3.5 gap-3">
            <div>
              <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                3 Foto Sampel Terlampir Siap Diesktrasikan
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Foto watermark kamera GPS (Tanah Laut) & 2 lembar SK IUP Kotabaru (PT. Tunggal Utamalestari).
              </p>
            </div>
            <button
              onClick={onExtractAllSamples}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengekstrak AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ekstrak Semua 3 Foto Sekaligus</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ALL_SAMPLE_DOCUMENTS.map((doc, idx) => (
              <div
                key={doc.id}
                className="bg-[#121216] border border-white/10 hover:border-indigo-500/40 rounded-lg p-3.5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-white/5 text-indigo-400 border border-indigo-500/20">
                      Sampel #{idx + 1}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {doc.points.length} Titik
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {doc.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-1">
                    {doc.company} {doc.location?.regency ? `• ${doc.location.regency}` : ''}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 italic">
                    {doc.sourceType === 'watermark_photo' ? 'Watermark Camera' : 'Dokumen Scan / Fotokopi'}
                  </span>
                  <button
                    onClick={() => onExtractDocument(doc)}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-indigo-600 hover:text-white text-indigo-300 text-xs font-medium rounded transition-colors"
                  >
                    Ekstrak Sampel Ini
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: File Upload (Drag & Drop) */}
      {activeTab === 'upload' && (
        <div className="mt-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-indigo-400 bg-indigo-500/10'
                : 'border-white/10 hover:border-white/20 bg-[#121216]'
            }`}
          >
            <input
              type="file"
              accept="image/*,.pdf"
              id="file-input"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="file-input" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-indigo-400 mb-3">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <h3 className="text-sm font-semibold text-white">
                {isLoading ? 'Menganalisis Koordinat dengan AI Gemini...' : 'Tarik & Lepas Berkas atau Klik untuk Unggah'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Mendukung foto dengan watermark GPS, foto dokumen photocopy, hasil scan SK IUP, tabel BPN/Kehutanan (PNG, JPG, WEBP).
              </p>
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Paste Chat Text */}
      {activeTab === 'chat' && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tempelkan Teks Koordinat dari WhatsApp, Telegram, atau Email:
            </label>
            <textarea
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={`Contoh teks chat WA:
Titik 1: 3°54'34"S 115°5'60"E (Asri Mulia Jorong)
Titik 2: 03° 10' 43.18" LS, 115° 59' 11.30" BT
Titik 3: Lat -3.178661, Long 115.986472`}
              rows={4}
              className="w-full bg-[#121216] border border-white/10 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleChatExtract}
              disabled={isLoading || !chatText.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Proses AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ekstrak Teks Chat</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Feedback Alert Messages */}
      {errorMsg && (
        <div className="mt-3 p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {extractedSuccess && (
        <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{extractedSuccess}</span>
        </div>
      )}
    </div>
  );
};
