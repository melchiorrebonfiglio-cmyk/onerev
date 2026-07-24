import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Loader2, Clipboard, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface ImagePasteExtractorProps {
  type: 'ordine' | 'sito' | 'servizio';
  label: string;
  placeholder: string;
  onExtracted: (data: any) => void;
}

export const ImagePasteExtractor: React.FC<ImagePasteExtractorProps> = ({
  type,
  label,
  placeholder,
  onExtracted,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasteOverlay, setShowPasteOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus container to capture paste events more easily
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Automatically focus the hidden textarea when overlay opens
  useEffect(() => {
    if (showPasteOverlay) {
      const timer = setTimeout(() => {
        overlayInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showPasteOverlay]);

  // Process selected or pasted file
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Il file selezionato non è un\'immagine valida.');
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    // Set preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          // Strip the data URL prefix (e.g. "data:image/png;base64,")
          const base64Data = base64String.split(',')[1];

          // Try server API first
          const response = await fetch('/api/gemini/extract-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type,
              type,
            }),
          });

          const contentType = response.headers.get('content-type') || '';

          if (!response.ok) {
            let errorMsg = `Errore server (HTTP ${response.status})`;
            if (contentType.includes('application/json')) {
              try {
                const errData = await response.json();
                errorMsg = errData.error || errorMsg;
              } catch (_) {}
            } else {
              const text = await response.text();
              if (response.status === 404 || text.trim().startsWith('<') || text.toLowerCase().includes('html')) {
                errorMsg = "Servizio API backend non raggiungibile (HTTP 404). Su GitHub Pages e hosting statici le rotte backend Node.js (/api) non sono attive. Per utilizzare l'estrazione AI Gemini è necessario distribuire l'applicazione su un hosting full-stack (es. Cloud Run, Render, Vercel) oppure configurare la chiave API client-side.";
              } else {
                errorMsg = text || errorMsg;
              }
            }
            throw new Error(errorMsg);
          }

          if (!contentType.includes('application/json')) {
            throw new Error("Il server ha restituito una risposta non JSON (pagina HTML). Assicurati che il server Node.js sia in esecuzione.");
          }

          const data = await response.json();
          onExtracted(data);
          setSuccess(true);
        } catch (innerErr: any) {
          console.error('Inner extraction error:', innerErr);
          setError(innerErr.message || 'Errore durante l\'estrazione con Gemini.');
          setSuccess(false);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Impossibile leggere il file immagine.');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Errore di connessione o analisi con Gemini.');
      setLoading(false);
    }
  };

  // Global window paste listener for fallback overlay
  useEffect(() => {
    if (!showPasteOverlay) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            e.stopPropagation();
            processFile(file);
            setShowPasteOverlay(false);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [showPasteOverlay]);

  // Paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Click-to-paste handler using Clipboard API
  const handleClipboardPaste = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setError(null);

    // Always attempt keyboard-paste overlay as the primary safe way inside iframes, 
    // or try direct Clipboard API first but fallback immediately.
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        throw new Error('Async Clipboard API not supported');
      }
      const clipboardItems = await navigator.clipboard.read();
      let imageFound = false;

      for (const clipboardItem of clipboardItems) {
        for (const mimeType of clipboardItem.types) {
          if (mimeType.startsWith('image/')) {
            const blob = await clipboardItem.getType(mimeType);
            const file = new File([blob], `clipboard-${type}.png`, { type: mimeType });
            processFile(file);
            imageFound = true;
            break;
          }
        }
        if (imageFound) break;
      }

      if (!imageFound) {
        setError('Nessuna immagine trovata negli appunti. Copia (Ctrl+C o screenshot) un\'immagine negli appunti prima di cliccare.');
      }
    } catch (err: any) {
      console.warn('Direct Clipboard read failed/blocked in this environment, using keyboard paste overlay fallback', err);
      setShowPasteOverlay(true);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {previewUrl && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Rimuovi immagine
          </button>
        )}
      </div>

      <div
        id={`dropzone-${type}`}
        ref={containerRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleClipboardPaste}
        className={`relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : previewUrl
            ? 'border-slate-300 dark:border-slate-600 bg-slate-50/30 dark:bg-slate-800/30'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-850'
        }`}
      >
        <input
          id={`file-input-${type}`}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="absolute inset-0 w-full h-full p-2 flex items-center justify-center overflow-hidden rounded-xl">
            <img
              src={previewUrl}
              alt="Anteprima"
              className="max-w-full max-h-full object-contain rounded-lg opacity-80"
              referrerPolicy="no-referrer"
            />
            {loading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center gap-2 backdrop-blur-xs">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Gemini sta estraendo i dati...
                </span>
              </div>
            )}
            {success && !loading && (
              <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg animate-bounce">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center flex flex-col items-center gap-2">
            <div 
              onClick={handleClipboardPaste}
              className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 p-4 rounded-full text-indigo-600 dark:text-indigo-400 mb-1 transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Clicca per incollare l'immagine dagli appunti"
            >
              <Clipboard className="w-7 h-7 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              Clicca l'icona per Incollare l'Immagine
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {placeholder}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileInput();
              }}
              className="mt-1 text-xs text-slate-450 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 underline font-medium cursor-pointer"
            >
              oppure seleziona un file dal computer
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-200/50 dark:border-red-900/30">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && !loading && (
        <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Dati estratti con successo! I campi sottostanti sono stati popolati automaticamente.</span>
        </div>
      )}

      {showPasteOverlay && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 capitalize">
                <Clipboard className="w-5 h-5 text-indigo-500" />
                Incolla Dati {type}
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteOverlay(false)}
                className="text-slate-450 hover:text-slate-650 dark:hover:text-slate-250 transition text-sm font-semibold p-1"
              >
                Annulla
              </button>
            </div>

            {/* Invisible focused textarea to receive paste event */}
            <textarea
              ref={overlayInputRef}
              onPaste={(e) => {
                handlePaste(e);
                setShowPasteOverlay(false);
              }}
              className="absolute -top-40 left-0 w-1 h-1 opacity-0 pointer-events-none"
              autoFocus
            />

            <div 
              onClick={() => overlayInputRef.current?.focus()}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 p-8 text-center cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition duration-150 flex flex-col items-center gap-3"
            >
              <div className="bg-indigo-500 dark:bg-indigo-600 text-white p-3.5 rounded-full shadow-lg animate-bounce mb-1">
                <Clipboard className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                Premi <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm border border-slate-300 dark:border-slate-700 font-mono shadow-sm">Ctrl + V</kbd> (o <kbd className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm border border-slate-300 dark:border-slate-700 font-mono shadow-sm">Cmd + V</kbd>)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Premi la combinazione di tasti sulla tastiera ora per incollare l'immagine memorizzata nei tuoi appunti.
              </p>
            </div>
            
            <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
              L'area si chiuderà automaticamente una volta rilevato e incollato l'elemento.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
