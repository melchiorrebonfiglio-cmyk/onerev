import React, { useState } from 'react';
import { RiferimentoSede, Ordine, Sito, Servizio } from '../types';
import { STANDARD_OPERATIONS } from '../constants';
import { ImagePasteExtractor } from './ImagePasteExtractor';

// Icons
import { MapPinIcon } from './icons/MapPinIcon';
import { UserIcon } from './icons/UserIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { ServerStackIcon } from './icons/ServerStackIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';

interface AddProjectFormProps {
  onAddProject: (
      crq: string, 
      ragioneSociale: string, 
      via: string, 
      citta: string, 
      riepilogo: string, 
      responsabileProgetto: string,
      operazioniNecessarie: string,
      note: string,
      riferimentoSede: RiferimentoSede,
      ordine?: Ordine,
      sitoA?: Sito,
      sitoZ?: Sito,
      servizio?: Servizio
  ) => void;
}

/**
 * Extracts a value from pasted text given a set of keywords.
 */
const extractValue = (text: string, fieldKeywords: string[]): string => {
  if (!text) return 'N/A';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Primary attempt: look specifically for keyword and find ':' on the same line
  for (const line of lines) {
    for (const keyword of fieldKeywords) {
      const lowerLine = line.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      
      const keywordIdx = lowerLine.indexOf(lowerKeyword);
      if (keywordIdx !== -1) {
        // Look for the colon ':' after the keyword
        const colonIdx = line.indexOf(':', keywordIdx);
        if (colonIdx !== -1) {
          let val = line.substring(colonIdx + 1).trim();
          if (val.startsWith('(') && val.endsWith(')')) {
            val = val.substring(1, val.length - 1).trim();
          }
          if (val) return val;
        }
      }
    }
  }

  // Fallback 1: check if line contains the keyword and any colon is present
  for (const line of lines) {
    for (const keyword of fieldKeywords) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          let val = line.substring(colonIdx + 1).trim();
          if (val.startsWith('(') && val.endsWith(')')) {
            val = val.substring(1, val.length - 1).trim();
          }
          if (val) return val;
        }
      }
    }
  }

  // Fallback 2: Check if keyword is on one line and value is on the next line
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    for (const keyword of fieldKeywords) {
      if (line.toLowerCase() === keyword.toLowerCase() || 
          line.toLowerCase().replace(':', '').trim() === keyword.toLowerCase()) {
        const nextLine = lines[i+1].trim();
        if (nextLine && !nextLine.includes(':') && nextLine.length < 100) {
          return nextLine;
        }
      }
    }
  }

  // Fallback 3: Substring search fallback (no colons)
  for (const line of lines) {
    for (const keyword of fieldKeywords) {
      const idx = line.toLowerCase().indexOf(keyword.toLowerCase());
      if (idx !== -1) {
        const remaining = line.substring(idx + keyword.length).replace(/^[\s:=–-]+/, '').trim();
        if (remaining && remaining.length < 100) {
          return remaining;
        }
      }
    }
  }

  return 'N/A';
};

const AddProjectForm: React.FC<AddProjectFormProps> = ({ onAddProject }) => {
  // Raw Paste Text Areas State
  const [rawOrdine, setRawOrdine] = useState('');
  const [rawSitoA, setRawSitoA] = useState('');
  const [rawSitoZ, setRawSitoZ] = useState('');
  const [rawServizio, setRawServizio] = useState('');

  // Step 1: Ordine States
  const [idOdf, setIdOdf] = useState('');
  const [idOrdine, setIdOrdine] = useState('');
  const [tipo, setTipo] = useState('');

  // Step 2: Sito A States
  const [tipologiaSitoA, setTipologiaSitoA] = useState('');
  const [indirizzoSitoA, setIndirizzoSitoA] = useState('');
  const [cittaSitoA, setCittaSitoA] = useState('');
  const [acronimoSitoA, setAcronimoSitoA] = useState('');
  const [riferimentoClienteSitoA, setRiferimentoClienteSitoA] = useState('');
  const [telefonoSitoA, setTelefonoSitoA] = useState('');
  const [emailSitoA, setEmailSitoA] = useState('');
  const [interfacciaSitoA, setInterfacciaSitoA] = useState('');

  // Step 3: Sito Z States
  const [tipologiaSitoZ, setTipologiaSitoZ] = useState('');
  const [indirizzoSitoZ, setIndirizzoSitoZ] = useState('');
  const [cittaSitoZ, setCittaSitoZ] = useState('');
  const [acronimoSitoZ, setAcronimoSitoZ] = useState('');
  const [riferimentoClienteSitoZ, setRiferimentoClienteSitoZ] = useState('');
  const [telefonoSitoZ, setTelefonoSitoZ] = useState('');
  const [emailSitoZ, setEmailSitoZ] = useState('');
  const [interfacciaSitoZ, setInterfacciaSitoZ] = useState('');

  // Step 4: Servizio States
  const [cpe, setCpe] = useState('');
  const [banda, setBanda] = useState('');
  const [noteIngaggio, setNoteIngaggio] = useState('');

  // Additional fields
  const [responsabileProgetto, setResponsabileProgetto] = useState('Bonfiglio Melchiorre');
  const [operazioniNecessarie, setOperazioniNecessarie] = useState(STANDARD_OPERATIONS);
  const [noteInterne, setNoteInterne] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Handlers for Raw Paste Text
  const handleRawOrdineChange = (text: string) => {
    setRawOrdine(text);
    if (!text.trim()) {
      setIdOdf('');
      setIdOrdine('');
      setTipo('');
      return;
    }
    setIdOdf(extractValue(text, ['id odf', 'odf id', 'odf', 'id_odf', 'idodf']));
    setIdOrdine(extractValue(text, ['id ordine', 'ordine id', 'ordine', 'id_ordine', 'crq', 'num ordine', 'numero ordine', 'idordine']));
    setTipo(extractValue(text, ['tipo', 'tipologia', 'tipo ordine', 'tipo_ordine', 'tipo odf', 'tipologia ordine', 'order type']));
  };

  const handleRawSitoAChange = (text: string) => {
    setRawSitoA(text);
    if (!text.trim()) {
      setTipologiaSitoA('');
      setIndirizzoSitoA('');
      setCittaSitoA('');
      setAcronimoSitoA('');
      setRiferimentoClienteSitoA('');
      setTelefonoSitoA('');
      setEmailSitoA('');
      setInterfacciaSitoA('');
      return;
    }
    setTipologiaSitoA(extractValue(text, ['tipologia sito', 'tipo sito', 'tipologia_sito', 'sito tipo', 'site type', 'tipologia']));
    setIndirizzoSitoA(extractValue(text, ['indirizzo', 'via', 'viale', 'piazza', 'corso', 'address', 'ind']));
    setCittaSitoA(extractValue(text, ['citta', "citta'", 'città', 'city', 'comune', 'localita', 'località']));
    setAcronimoSitoA(extractValue(text, ['acronimo', 'codice sito', 'codice_sito', 'acronym', 'id sito', 'codice', 'acr']));
    setRiferimentoClienteSitoA(extractValue(text, ['riferimento cliente', 'cliente riferimento', 'referente', 'contatto', 'riferimento', 'customer contact', 'referente cliente', 'rif cliente', 'rif. cliente']));
    setTelefonoSitoA(extractValue(text, ['telefono', 'tel', 'cellulare', 'cell', 'phone', 'telephone', 'mobile', 'recapito']));
    setEmailSitoA(extractValue(text, ['e-mail', 'email', 'mail', 'indirizzo email', 'indirizzo e-mail', 'e mail']));
    setInterfacciaSitoA(extractValue(text, ['interfaccia', 'interface', 'porta', 'connessione', 'tipo interfaccia', 'port']));
  };

  const handleRawSitoZChange = (text: string) => {
    setRawSitoZ(text);
    if (!text.trim()) {
      setTipologiaSitoZ('');
      setIndirizzoSitoZ('');
      setCittaSitoZ('');
      setAcronimoSitoZ('');
      setRiferimentoClienteSitoZ('');
      setTelefonoSitoZ('');
      setEmailSitoZ('');
      setInterfacciaSitoZ('');
      return;
    }
    setTipologiaSitoZ(extractValue(text, ['tipologia sito', 'tipo sito', 'tipologia_sito', 'sito tipo', 'site type', 'tipologia']));
    setIndirizzoSitoZ(extractValue(text, ['indirizzo', 'via', 'viale', 'piazza', 'corso', 'address', 'ind']));
    setCittaSitoZ(extractValue(text, ['citta', "citta'", 'città', 'city', 'comune', 'localita', 'località']));
    setAcronimoSitoZ(extractValue(text, ['acronimo', 'codice sito', 'codice_sito', 'acronym', 'id sito', 'codice', 'acr']));
    setRiferimentoClienteSitoZ(extractValue(text, ['riferimento cliente', 'cliente riferimento', 'referente', 'contatto', 'riferimento', 'customer contact', 'referente cliente', 'rif cliente', 'rif. cliente']));
    setTelefonoSitoZ(extractValue(text, ['telefono', 'tel', 'cellulare', 'cell', 'phone', 'telephone', 'mobile', 'recapito']));
    setEmailSitoZ(extractValue(text, ['e-mail', 'email', 'mail', 'indirizzo email', 'indirizzo e-mail', 'e mail']));
    setInterfacciaSitoZ(extractValue(text, ['interfaccia', 'interface', 'porta', 'connessione', 'tipo interfaccia', 'port']));
  };

  const handleRawServizioChange = (text: string) => {
    setRawServizio(text);
    if (!text.trim()) {
      setCpe('');
      setBanda('');
      setNoteIngaggio('');
      return;
    }
    setCpe(extractValue(text, ['cpe', 'router', 'apparato cliente', 'apparato_cliente', 'device']));
    setBanda(extractValue(text, ['banda', 'velocita', 'velocità', 'speed', 'bandwidth', 'banda minima', 'profilo banda']));
    const ingaggioValue = extractValue(text, ['note per l\'ingaggio', "note per l'ingaggio", 'note ingaggio', 'note per ingaggio', 'note', 'engagement notes', 'note ingaggio opzionale']);
    setNoteIngaggio(ingaggioValue === 'N/A' ? '' : ingaggioValue);
  };

  // Extract from all pasted content manually or finalize creation
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Final checks
    const finalIdOrdine = idOrdine.trim() || 'N/A';
    const finalRagioneSociale = riferimentoClienteSitoA.trim() || 'N/A';
    const finalIndirizzo = indirizzoSitoA.trim() || 'N/A';
    const finalCitta = cittaSitoA.trim() || 'N/A';

    if (finalIdOrdine === 'N/A' || !finalIdOrdine) {
      setError("Impossibile procedere: L'ID ORDINE è obbligatorio per identificare il progetto.");
      return;
    }

    // Build sub objects
    const ordineObj: Ordine = {
      idOdf: idOdf.trim() || 'N/A',
      idOrdine: finalIdOrdine,
      tipo: tipo.trim() || 'N/A'
    };

    const sitoAObj: Sito = {
      tipologiaSito: tipologiaSitoA.trim() || 'N/A',
      indirizzo: finalIndirizzo,
      citta: finalCitta,
      acronimo: acronimoSitoA.trim() || 'N/A',
      riferimentoCliente: finalRagioneSociale,
      telefono: telefonoSitoA.trim() || 'N/A',
      email: emailSitoA.trim() || 'N/A',
      interfaccia: interfacciaSitoA.trim() || 'N/A'
    };

    const sitoZObj: Sito = {
      tipologiaSito: tipologiaSitoZ.trim() || 'N/A',
      indirizzo: indirizzoSitoZ.trim() || 'N/A',
      citta: cittaSitoZ.trim() || 'N/A',
      acronimo: acronimoSitoZ.trim() || 'N/A',
      riferimentoCliente: riferimentoClienteSitoZ.trim() || 'N/A',
      telefono: telefonoSitoZ.trim() || 'N/A',
      email: emailSitoZ.trim() || 'N/A',
      interfaccia: interfacciaSitoZ.trim() || 'N/A'
    };

    const servizioObj: Servizio = {
      cpe: cpe.trim() || 'N/A',
      banda: banda.trim() || 'N/A',
      noteIngaggio: noteIngaggio.trim()
    };

    // Compose a summary / riepilogo
    const composedRiepilogo = `Ordine: ${ordineObj.idOrdine} (${ordineObj.tipo}) | Sito A: ${sitoAObj.acronimo} - Sito Z: ${sitoZObj.acronimo} | CPE: ${servizioObj.cpe} | Banda: ${servizioObj.banda}`;

    onAddProject(
      finalIdOrdine, // CRQ/Project ID
      finalRagioneSociale, // Client / Company name
      finalIndirizzo, // Via
      finalCitta, // Citta
      composedRiepilogo, // Riepilogo
      responsabileProgetto,
      operazioniNecessarie,
      noteInterne,
      { referente: finalRagioneSociale, tel: sitoAObj.telefono }, // Riferimento Sede
      ordineObj,
      sitoAObj,
      sitoZObj,
      servizioObj
    );

    // Clear all form inputs
    setRawOrdine('');
    setRawSitoA('');
    setRawSitoZ('');
    setRawServizio('');

    setIdOdf('');
    setIdOrdine('');
    setTipo('');

    setTipologiaSitoA('');
    setIndirizzoSitoA('');
    setCittaSitoA('');
    setAcronimoSitoA('');
    setRiferimentoClienteSitoA('');
    setTelefonoSitoA('');
    setEmailSitoA('');
    setInterfacciaSitoA('');

    setTipologiaSitoZ('');
    setIndirizzoSitoZ('');
    setCittaSitoZ('');
    setAcronimoSitoZ('');
    setRiferimentoClienteSitoZ('');
    setTelefonoSitoZ('');
    setEmailSitoZ('');
    setInterfacciaSitoZ('');

    setCpe('');
    setBanda('');
    setNoteIngaggio('');

    setResponsabileProgetto('Bonfiglio Melchiorre');
    setOperazioniNecessarie(STANDARD_OPERATIONS);
    setNoteInterne('');
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-indigo-500" />
            Aggiungi Progetto tramite Estrazione Immagini (AI)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Incolla (Ctrl+V) o trascina gli screenshot della centrale o dell'ordine. L'intelligenza artificiale di Gemini estrarrà automaticamente tutti i campi!
          </p>
        </div>
      </div>

      <form onSubmit={handleFinalSubmit} className="space-y-6">
        {/* STEP 1: INSERISCI I DATI ORDINE */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold">1</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">INSERISCI I DATI ORDINE</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ImagePasteExtractor
                type="ordine"
                label="Caricamento Dati Ordine"
                placeholder="Incolla lo screenshot dell'ordine (ID ODF, ID ORDINE, TIPO)"
                onExtracted={(data) => {
                  setIdOdf(data.idOdf || 'N/A');
                  setIdOrdine(data.idOrdine || 'N/A');
                  setTipo(data.tipo || 'N/A');
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">1) ID ODF</label>
                <input
                  type="text"
                  value={idOdf}
                  onChange={(e) => setIdOdf(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">2) ID ORDINE</label>
                <input
                  type="text"
                  value={idOrdine}
                  onChange={(e) => setIdOrdine(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">3) TIPO</label>
                <input
                  type="text"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: SITO A */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold">2</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">SITO A</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ImagePasteExtractor
                type="sito"
                label="Caricamento SITO A"
                placeholder="Incolla lo screenshot con i dati e le tabelle del SITO A"
                onExtracted={(data) => {
                  setTipologiaSitoA(data.tipologiaSito || 'N/A');
                  setIndirizzoSitoA(data.indirizzo || 'N/A');
                  setCittaSitoA(data.citta || 'N/A');
                  setAcronimoSitoA(data.acronimo || 'N/A');
                  setRiferimentoClienteSitoA(data.riferimentoCliente || 'N/A');
                  setTelefonoSitoA(data.telefono || 'N/A');
                  setEmailSitoA(data.email || 'N/A');
                  setInterfacciaSitoA(data.interfaccia || 'N/A');
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">1) TIPOLOGIA SITO</label>
                <input
                  type="text"
                  value={tipologiaSitoA}
                  onChange={(e) => setTipologiaSitoA(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">3) CITTA'</label>
                <input
                  type="text"
                  value={cittaSitoA}
                  onChange={(e) => setCittaSitoA(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">2) INDIRIZZO (Via, Piazza ecc.)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPinIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={indirizzoSitoA}
                    onChange={(e) => setIndirizzoSitoA(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">4) ACRONIMO</label>
                <input
                  type="text"
                  value={acronimoSitoA}
                  onChange={(e) => setAcronimoSitoA(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">5) RIFERIMENTO CLIENTE</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={riferimentoClienteSitoA}
                    onChange={(e) => setRiferimentoClienteSitoA(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">6) TELEFONO</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <PhoneIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={telefonoSitoA}
                    onChange={(e) => setTelefonoSitoA(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">7) E-MAIL</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={emailSitoA}
                    onChange={(e) => setEmailSitoA(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">8) INTERFACCIA</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <ServerStackIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={interfacciaSitoA}
                    onChange={(e) => setInterfacciaSitoA(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: SITO Z */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold">3</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">SITO Z</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ImagePasteExtractor
                type="sito"
                label="Caricamento SITO Z"
                placeholder="Incolla lo screenshot con i dati e le tabelle del SITO Z"
                onExtracted={(data) => {
                  setTipologiaSitoZ(data.tipologiaSito || 'N/A');
                  setIndirizzoSitoZ(data.indirizzo || 'N/A');
                  setCittaSitoZ(data.citta || 'N/A');
                  setAcronimoSitoZ(data.acronimo || 'N/A');
                  setRiferimentoClienteSitoZ(data.riferimentoCliente || 'N/A');
                  setTelefonoSitoZ(data.telefono || 'N/A');
                  setEmailSitoZ(data.email || 'N/A');
                  setInterfacciaSitoZ(data.interfaccia || 'N/A');
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">1) TIPOLOGIA SITO</label>
                <input
                  type="text"
                  value={tipologiaSitoZ}
                  onChange={(e) => setTipologiaSitoZ(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">3) CITTA'</label>
                <input
                  type="text"
                  value={cittaSitoZ}
                  onChange={(e) => setCittaSitoZ(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">2) INDIRIZZO (Via, Piazza ecc.)</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPinIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={indirizzoSitoZ}
                    onChange={(e) => setIndirizzoSitoZ(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">4) ACRONIMO</label>
                <input
                  type="text"
                  value={acronimoSitoZ}
                  onChange={(e) => setAcronimoSitoZ(e.target.value)}
                  placeholder="In attesa di testo..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">5) RIFERIMENTO CLIENTE</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={riferimentoClienteSitoZ}
                    onChange={(e) => setRiferimentoClienteSitoZ(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">6) TELEFONO</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <PhoneIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={telefonoSitoZ}
                    onChange={(e) => setTelefonoSitoZ(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">7) E-MAIL</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <EnvelopeIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={emailSitoZ}
                    onChange={(e) => setEmailSitoZ(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">8) INTERFACCIA</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <ServerStackIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={interfacciaSitoZ}
                    onChange={(e) => setInterfacciaSitoZ(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4: SERVIZIO */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold">4</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">SERVIZIO</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ImagePasteExtractor
                type="servizio"
                label="Caricamento Dati Servizio"
                placeholder="Incolla lo screenshot del servizio (CPE/Router, Banda, Note Ingaggio)"
                onExtracted={(data) => {
                  setCpe(data.cpe || 'N/A');
                  setBanda(data.banda || 'N/A');
                  setNoteIngaggio(data.noteIngaggio || '');
                }}
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">1) CPE</label>
                  <input
                    type="text"
                    value={cpe}
                    onChange={(e) => setCpe(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">2) BANDA</label>
                  <input
                    type="text"
                    value={banda}
                    onChange={(e) => setBanda(e.target.value)}
                    placeholder="In attesa di testo..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">3) NOTE PER L'INGAGGIO (OPZIONALE)</label>
                <textarea
                  value={noteIngaggio}
                  onChange={(e) => setNoteIngaggio(e.target.value)}
                  placeholder="In attesa di testo o digita qui..."
                  className="w-full h-16 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DETTAGLI AGGIUNTIVI & GESTIONE INTERNA */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Dettagli Interni App</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="responsabile-interna" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Responsabile del Progetto
              </label>
              <select
                id="responsabile-interna"
                value={responsabileProgetto}
                onChange={(e) => setResponsabileProgetto(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
              >
                <option value="Bonfiglio Melchiorre">Bonfiglio Melchiorre</option>
                <option value="N/A">N/A</option>
              </select>
            </div>
            <div>
              <label htmlFor="note-interne" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Note Interne (Promemoria non visibile in PPT)
              </label>
              <input
                id="note-interne"
                type="text"
                value={noteInterne}
                onChange={(e) => setNoteInterne(e.target.value)}
                placeholder="Inserisci note aggiuntive per uso interno..."
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="operazioni-necessarie" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Operazioni Necessarie (Sub-tasks standard)
              </label>
              <textarea
                id="operazioni-necessarie"
                value={operazioniNecessarie}
                onChange={(e) => setOperazioniNecessarie(e.target.value)}
                className="w-full h-24 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900 text-sm font-medium">
            {error}
          </div>
        )}

        {/* FINAL SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-lg">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-100">Pronto per aggiungere il progetto?</h4>
              <p className="text-xs text-slate-400">
                {idOrdine.trim() ? `Pronto a creare il progetto con ID ORDINE "${idOrdine}"` : 'Incolla almeno l\'ID ORDINE nel primo step per abilitare l\'aggiunta'}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={!idOrdine.trim() || idOrdine.trim() === 'N/A'}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow transition duration-200 text-sm flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>ESTRAI I DATI E AGGIUNGI il PROGETTO</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProjectForm;
