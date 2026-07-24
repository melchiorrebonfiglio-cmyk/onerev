
import React, { useMemo, useState } from 'react';
import { Project, TechnicalData, SitoIntermedio } from '../types';
import { STANDARD_OPERATIONS } from '../constants';
import ProgressBar from './ProgressBar';
import { MapPinIcon } from './icons/MapPinIcon';
import { UserIcon } from './icons/UserIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { ChatBubbleLeftEllipsisIcon } from './icons/ChatBubbleLeftEllipsisIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ServerStackIcon } from './icons/ServerStackIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { generatePpt } from '../utils/pptGenerator';

// FIX: Define ProjectCardProps interface
interface ProjectCardProps {
  project: Project;
  onToggleActivity: (projectId: string, activityId: number, commandData?: { idCommand: string, namingServizio: string }) => void;
  onToggleSubTask: (projectId: string, activityId: number) => void;
  onDuplicateActivity: (projectId: string, activityId: number) => void;
  onOpenEditModal: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject?: (originalProjectId: string, project: Project) => void;
}

const calculateNetworkIp = (deviceIp: string): string => {
  if (!deviceIp) return 'N/A';
  // Regex to ensure it's a valid IP-like format before processing
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/;
  const match = deviceIp.match(ipRegex);
  
  if (!match) return 'IP non valido';

  const parts = match[0].split('.');
  if (parts.length !== 4) return 'IP non valido';
  
  const lastOctet = parseInt(parts[3], 10);
  if (isNaN(lastOctet) || lastOctet < 1) return 'IP non valido';
  
  parts[3] = (lastOctet - 1).toString();
  return parts.join('.');
};

const isValValid = (val: string | undefined | null): boolean => {
  if (!val) return false;
  const stripped = val.trim();
  return stripped.toUpperCase() !== 'N/A' && stripped !== '';
};

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onToggleActivity, 
  onToggleSubTask,
  onDuplicateActivity, 
  onOpenEditModal, 
  onDeleteProject,
  onUpdateProject
}) => {
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(project.note || '');

  const { completedActivities, totalActivities, progress } = useMemo(() => {
    const total = project.activities.length;
    const completed = project.activities.filter(a => a.completed).length;
    return {
      completedActivities: completed,
      totalActivities: total,
      progress: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [project.activities]);

  const isClosed = project.status === 'closed';
  const isPending = project.status === 'pending';
  const isDisabled = isClosed || isPending;
  
  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Data non valida';
    }
  };
  
  const technicalActivities = project.activities.filter(a => a.technicalData);

  const customerSite = useMemo(() => {
    const sites = [];
    if (project.sitoA) sites.push(project.sitoA);
    if (project.sitoZ) sites.push(project.sitoZ);
    
    // Look for site where tipologiaSito matches "COLOCATIONCUSTMERSITE" (case-insensitive and whitespace-stripped)
    const exactMatch = sites.find(s => {
      const typeClean = s.tipologiaSito?.toLowerCase().replace(/[^a-z0-9]/g, '');
      return typeClean === 'colocationcustmersite' || typeClean === 'colocationcustomersite';
    });
    if (exactMatch) return exactMatch;
    
    // Look for site where tipologiaSito includes 'colocation' or 'customer' or 'cliente'
    const partialMatch = sites.find(s => {
      const typeLower = s.tipologiaSito?.toLowerCase() || '';
      return typeLower.includes('colocation') || typeLower.includes('cust') || typeLower.includes('client');
    });
    if (partialMatch) return partialMatch;
    
    return null;
  }, [project.sitoA, project.sitoZ]);

  const handleGeneratePpt = async () => {
    await generatePpt(project, setIsGeneratingPpt);
  };


  const handleSaveNote = () => {
    if (onUpdateProject) {
      onUpdateProject(project.id, { ...project, note: tempNote });
    }
    setIsEditingNote(false);
  };

  const handleCancelNote = () => {
    setTempNote(project.note || '');
    setIsEditingNote(false);
  };

  const { idOrdineVal, idOdfVal, tipoVal } = useMemo(() => {
    const cleanVal = (val: string | undefined | null) => {
      if (!val) return null;
      const stripped = val.trim();
      if (stripped.toUpperCase() === 'N/A' || stripped === '') return null;
      return stripped;
    };
    return {
      idOrdineVal: cleanVal(project.ordine?.idOrdine) || cleanVal(project.id),
      idOdfVal: cleanVal(project.ordine?.idOdf),
      tipoVal: cleanVal(project.ordine?.tipo),
    };
  }, [project.ordine, project.id]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <header className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-full">
          {/* Distributed Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/40 w-full">
            {idOrdineVal && (
              <div>
                <span className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID ORDINE</span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                  {idOrdineVal}
                </h2>
              </div>
            )}
            
            {idOdfVal && (
              <div>
                <span className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID ODF</span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                  {idOdfVal}
                </h2>
              </div>
            )}

            {tipoVal && (
              <div>
                <span className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">TIPO</span>
                <span className="inline-block mt-1.5 text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded uppercase tracking-wide">
                  {tipoVal}
                </span>
              </div>
            )}
          </div>

          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">{project.ragioneSociale}</p>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
            <span>Creato il: {formatDate(project.createdAt)}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>Ultima modifica: {formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </header>

      {/* Pulsanti di azione posizionati al di sotto dell'intestazione */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-50/50 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-100 dark:border-slate-700/20">
        <button
          onClick={handleGeneratePpt}
          disabled={isGeneratingPpt}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-wait shadow-sm"
        >
          <DocumentTextIcon className="h-4 w-4 text-indigo-500" /> {isGeneratingPpt ? 'Generazione...' : 'Genera PPT'}
        </button>
        <button
          onClick={() => onOpenEditModal(project)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm"
        >
          <PencilSquareIcon className="h-4 w-4 text-amber-500" /> Modifica
        </button>
        <button
          onClick={() => onDeleteProject(project.id)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition shadow-sm"
        >
          <TrashIcon className="h-4 w-4 text-red-500" /> Elimina
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
            {customerSite ? 'Dettagli Sede Cliente (Colocation Custmer Site)' : 'Dettagli Sede'}
          </h3>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {isValValid(customerSite ? customerSite.indirizzo : project.via) && (
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                <span>
                  {customerSite 
                    ? `${customerSite.indirizzo}, ${customerSite.citta} ${isValValid(customerSite.acronimo) ? `(${customerSite.acronimo})` : ''}`
                    : `${project.via}, ${project.citta}`
                  }
                </span>
              </div>
            )}
            
            {isValValid(customerSite ? customerSite.riferimentoCliente : project.riferimentoSede?.referente) && (
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                <span>
                  <strong>Referente:</strong>{' '}
                  {customerSite ? customerSite.riferimentoCliente : project.riferimentoSede.referente}
                </span>
              </div>
            )}
            
            {isValValid(customerSite ? customerSite.telefono : project.riferimentoSede?.tel) && (
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                <span>
                  <strong>Tel:</strong>{' '}
                  {customerSite ? customerSite.telefono : project.riferimentoSede.tel}
                </span>
              </div>
            )}

            {isValValid(customerSite?.email) && (
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                <span>
                  <strong>Email:</strong> {customerSite.email}
                </span>
              </div>
            )}

            {isValValid(customerSite?.interfaccia) && (
              <div className="flex items-start">
                <ServerStackIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                <span>
                  <strong>Interfaccia:</strong> {customerSite.interfaccia}
                </span>
              </div>
            )}

            {isValValid(project.responsabileProgetto) && (
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                <span><strong>Responsabile Progetto:</strong> {project.responsabileProgetto}</span>
              </div>
            )}
          </div>
        </div>
        {(isValValid(project.riepilogo) || (project.servizio && (isValValid(project.servizio.cpe) || isValValid(project.servizio.banda) || isValValid(project.servizio.noteIngaggio)))) && (
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">Riepilogo & Servizio</h3>
            <div className="space-y-4">
              {isValValid(project.riepilogo) && (
                <div className="flex items-start text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/20 p-3 rounded-xl border border-slate-100 dark:border-slate-700/30">
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 flex-shrink-0" />
                  <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{project.riepilogo}</p>
                </div>
              )}
              {project.servizio && (isValValid(project.servizio.cpe) || isValValid(project.servizio.banda) || isValValid(project.servizio.noteIngaggio)) && (
                <div className="bg-pink-50/40 dark:bg-pink-950/10 p-4 rounded-xl border border-pink-100 dark:border-pink-900/30 space-y-2">
                  <h4 className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">DATI SERVIZIO</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {isValValid(project.servizio.cpe) && (
                      <div>
                        <span className="text-slate-500 font-medium">CPE:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">{project.servizio.cpe}</strong>
                      </div>
                    )}
                    {isValValid(project.servizio.banda) && (
                      <div>
                        <span className="text-slate-500 font-medium">BANDA:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">{project.servizio.banda}</strong>
                      </div>
                    )}
                  </div>
                  {isValValid(project.servizio.noteIngaggio) && (
                    <div className="pt-2 border-t border-pink-100 dark:border-pink-900/20 mt-2">
                      <span className="text-slate-500 font-medium text-[11px]">NOTE INGAGGIO:</span>
                      <p className="text-slate-700 dark:text-slate-300 italic mt-0.5 max-h-20 overflow-y-auto whitespace-pre-wrap text-[11px]">
                        {project.servizio.noteIngaggio}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4 Step Extracted Data Section */}
      {(project.sitoA || project.sitoZ) && (
        <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-3">DATI DEL SERVIZIO</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 2: Sito A */}
            {project.sitoA && (
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">SITO A</h4>
                <div className="text-xs space-y-1.5">
                  {isValValid(project.sitoA.tipologiaSito) && (
                    <div><span className="text-slate-500">TIPO SITO:</span> <strong className="text-slate-800 dark:text-slate-200">{project.sitoA.tipologiaSito}</strong></div>
                  )}
                  {(isValValid(project.sitoA.indirizzo) || isValValid(project.sitoA.citta)) && (
                    <div className="flex items-center gap-1.5"><MapPinIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200 truncate">{project.sitoA.indirizzo}, {project.sitoA.citta}</span></div>
                  )}
                  {isValValid(project.sitoA.acronimo) && (
                    <div><span className="text-slate-500">ACRONIMO:</span> <strong className="text-slate-800 dark:text-slate-200 font-mono">{project.sitoA.acronimo}</strong></div>
                  )}
                  {isValValid(project.sitoA.riferimentoCliente) && (
                    <div className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200 truncate">{project.sitoA.riferimentoCliente}</span></div>
                  )}
                  {isValValid(project.sitoA.telefono) && (
                    <div className="flex items-center gap-1.5"><PhoneIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200">{project.sitoA.telefono}</span></div>
                  )}
                  {isValValid(project.sitoA.email) && (
                    <div className="flex items-center gap-1.5"><EnvelopeIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200 truncate">{project.sitoA.email}</span></div>
                  )}
                  {isValValid(project.sitoA.interfaccia) && (
                    <div className="flex items-center gap-1.5"><ServerStackIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200">{project.sitoA.interfaccia}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Sito Z */}
            {project.sitoZ && (
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-2">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">SITO Z</h4>
                <div className="text-xs space-y-1.5">
                  {isValValid(project.sitoZ.tipologiaSito) && (
                    <div><span className="text-slate-500">TIPO SITO:</span> <strong className="text-slate-800 dark:text-slate-200">{project.sitoZ.tipologiaSito}</strong></div>
                  )}
                  {(isValValid(project.sitoZ.indirizzo) || isValValid(project.sitoZ.citta)) && (
                    <div className="flex items-center gap-1.5"><MapPinIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200 truncate">{project.sitoZ.indirizzo}, {project.sitoZ.citta}</span></div>
                  )}
                  {isValValid(project.sitoZ.acronimo) && (
                    <div><span className="text-slate-500">ACRONIMO:</span> <strong className="text-slate-800 dark:text-slate-200 font-mono">{project.sitoZ.acronimo}</strong></div>
                  )}
                  {isValValid(project.sitoZ.riferimentoCliente) && (
                    <div className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200 truncate">{project.sitoZ.riferimentoCliente}</span></div>
                  )}
                  {isValValid(project.sitoZ.telefono) && (
                    <div className="flex items-center gap-1.5"><PhoneIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200">{project.sitoZ.telefono}</span></div>
                  )}
                  {isValValid(project.sitoZ.email) && (
                    <div className="flex items-center gap-1.5"><EnvelopeIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200 truncate">{project.sitoZ.email}</span></div>
                  )}
                  {isValValid(project.sitoZ.interfaccia) && (
                    <div className="flex items-center gap-1.5"><ServerStackIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> <span className="text-slate-800 dark:text-slate-200">{project.sitoZ.interfaccia}</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Section */}
      <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Note (Promemoria interno)</h3>
          {!isEditingNote && (
            <button 
              onClick={() => setIsEditingNote(true)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <PencilSquareIcon className="h-3 w-3" /> Modifica Note
            </button>
          )}
        </div>
        
        {isEditingNote ? (
          <div className="space-y-2">
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Inserisci qui le note interne..."
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={handleCancelNote}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
              >
                <XCircleIcon className="h-4 w-4" /> Annulla
              </button>
              <button 
                onClick={handleSaveNote}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition"
              >
                <CheckCircleIcon className="h-4 w-4" /> Salva Note
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start text-sm text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <DocumentTextIcon className="h-5 w-5 mr-3 mt-0.5 text-amber-500 flex-shrink-0" />
            {project.note ? (
              <p className="whitespace-pre-wrap italic">{project.note}</p>
            ) : (
              <p className="italic text-slate-400">Nessuna nota inserita. Clicca su "Modifica Note" per aggiungerne una.</p>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Progresso</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{completedActivities} / {totalActivities} Attività</span>
        </div>
        <ProgressBar progress={progress} projectStatus={project.status} />
      </div>

      <div className="space-y-6">
        {technicalActivities.length > 0 && technicalActivities.map((activity, index) => {
            const techData = activity.technicalData;
            if (!techData) return null;
            return (
                <div key={activity.id}>
                    <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                        <ServerStackIcon className="h-4 w-4" />
                        Dati Tecnici Apparato{technicalActivities.length > 1 ? ` ${index + 1}` : ''}
                    </h3>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg space-y-1">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 p-2 rounded bg-white dark:bg-slate-800/60">
                        <div>Nome Apparato: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.nomeApparato || 'N/A'}</strong></div>
                        <div>Tipo Apparato: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.tipoApparato || 'N/A'}</strong></div>
                        <div>Porta Apparato Cliente: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.portaApparatoCliente || 'N/A'}</strong></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 p-2 rounded bg-slate-200 dark:bg-slate-700/60">
                        <div>IP Rete (/30): <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{calculateNetworkIp(techData.ip)}</strong></div>
                        <div>IP Apparato: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.ip || 'N/A'}</strong></div>
                        <div>IP Gateway: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.ipGateway || 'N/A'}</strong></div>
                        </div>

                        {/* Siti Intermedi Group */}
                        {(() => {
                            const siti = techData.sitiIntermedi && techData.sitiIntermedi.length > 0 
                                ? techData.sitiIntermedi 
                                : [{
                                    id: 'legacy',
                                    centrale: techData.centraleDiAttestazioneFibra || '',
                                    apparato: techData.apparatoAttestazioneFibra || '',
                                    posizione: techData.posizioneApparatoInCentrale || '',
                                    porta: techData.portaApparatoAttestazioneFibra || '',
                                    attivita: ''
                                }];
                            return (
                                <div className="space-y-2 col-span-full">
                                    {siti.map((sito, sIndex) => (
                                        <div key={sito.id || sIndex} className="p-3 border border-indigo-100 dark:border-indigo-950/40 rounded bg-indigo-50/50 dark:bg-indigo-950/10 space-y-2">
                                            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                                                Sito Intermedio {siti.length > 1 ? `#${sIndex + 1}` : ''}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                                                <div>Centrale: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm font-sans">{sito.centrale || 'N/A'}</strong></div>
                                                <div>Apparato: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm font-sans">{sito.apparato || 'N/A'}</strong></div>
                                                <div>Posizione: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm font-sans">{sito.posizione || 'N/A'}</strong></div>
                                                <div>Porta: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm font-sans">{sito.porta || 'N/A'}</strong></div>
                                            </div>
                                            {sito.attivita && (
                                                <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-indigo-100 dark:border-indigo-950/40 pt-1.5 mt-1">
                                                    Attività nel sito intermedio: <strong className="text-slate-800 dark:text-slate-200 font-sans block mt-0.5 text-sm">{sito.attivita}</strong>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 p-2 rounded bg-slate-200 dark:bg-slate-700/60">
                        <div>Centrale Terminazione MGT: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.centraleDiAttestazioneMgt || 'N/A'}</strong></div>
                        <div>SVLAN MGT: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.svlanMgt || 'N/A'}</strong></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 p-2 rounded bg-white dark:bg-slate-800/60">
                        <div>Centrale Terminazione Servizio: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.terminazioneDelServizio || 'N/A'}</strong></div>
                        <div>Tipo di Consegna: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.tipoConsegna || 'N/A'}</strong></div>
                        <div>Rete di Consegna: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.reteConsegna || 'N/A'}</strong></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 p-2 rounded bg-slate-200 dark:bg-slate-700/60">
                        <div>Apparato Transport: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.apparatoTransportAttestazioneServizio || 'N/A'}</strong></div>
                        <div>Porta Apparato: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.portaApparatoAttestazioneServizio || 'N/A'}</strong></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 p-2 rounded bg-white dark:bg-slate-800/60">
                        <div>Apparato IP (NNI): <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.apparatoIpNni || 'N/A'}</strong></div>
                        <div>ID (ENRI/Command): <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.idEnriCommand || 'N/A'}</strong></div>
                        <div>Posizione Apparato: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.posizioneApparato || 'N/A'}</strong></div>
                        <div>SVLAN PAY: <strong className="text-slate-800 dark:text-slate-200 block mt-1 text-sm">{techData.svlanPay || 'N/A'}</strong></div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ProjectCard;
