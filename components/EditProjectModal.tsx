
import React, { useState } from 'react';
import { Project, Activity, TechnicalData, SitoIntermedio } from '../types';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { TIPO_APPARATI, STANDARD_OPERATIONS, PORTA_APPARATO_CLIENTE_OPTIONS } from '../constants';

interface EditProjectModalProps {
  project: Project;
  onUpdateProject: (originalProjectId: string, project: Project) => void;
  onClose: () => void;
  infrastructureData: Record<string, Record<string, string[]>>;
  serviceTerminationData: any;
}

const calculateGateway = (ip: string) => {
    if (!ip) return '';
    // Remove CIDR if present
    const parts = ip.split('/')[0].trim().split('.');
    if (parts.length === 4) {
        const last = parseInt(parts[3], 10);
        if (!isNaN(last)) {
            parts[3] = (last + 1).toString();
            return parts.join('.');
        }
    }
    return '';
};

const calculateNetworkIp = (ip: string) => {
    if (!ip) return '';
    const parts = ip.split('/')[0].trim().split('.');
    if (parts.length === 4) {
        const last = parseInt(parts[3], 10);
        if (!isNaN(last) && last > 0) {
            parts[3] = (last - 1).toString();
            return parts.join('.');
        }
    }
    return '';
};


const MGT_CENTRALS = [
    "ROMA CORNELIA DC - ROMA/TDX -7090 240G GE 2.11",
    "MILANO CALDERA - Milano/TDE -7090 100Cem GE 2.7"
];

const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, onUpdateProject, onClose, infrastructureData, serviceTerminationData }) => {
  const [formData, setFormData] = useState<Project>(() => {
    const data = JSON.parse(JSON.stringify(project));
    if (!data.operazioniNecessarie) {
        data.operazioniNecessarie = STANDARD_OPERATIONS;
    }
    return data;
  });
  const [isDatiOrdineExpanded, setIsDatiOrdineExpanded] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRiferimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        riferimentoSede: {
            ...prev.riferimentoSede,
            [name]: value
        }
    }));
  };

  const handleOrdineChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      ordine: prev.ordine ? { ...prev.ordine, [field]: value } : { idOdf: 'N/A', idOrdine: 'N/A', tipo: 'N/A', [field]: value } as any
    }));
  };

  const handleSitoAChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sitoA: prev.sitoA ? { ...prev.sitoA, [field]: value } : {
        tipologiaSito: 'N/A', indirizzo: 'N/A', citta: 'N/A', acronimo: 'N/A',
        riferimentoCliente: 'N/A', riferimentoClienteIcon: true,
        telefono: 'N/A', telefonoIcon: true,
        email: 'N/A', emailIcon: true,
        interfaccia: 'N/A', interfacciaIcon: true, [field]: value
      } as any
    }));
  };

  const handleSitoZChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sitoZ: prev.sitoZ ? { ...prev.sitoZ, [field]: value } : {
        tipologiaSito: 'N/A', indirizzo: 'N/A', citta: 'N/A', acronimo: 'N/A',
        riferimentoCliente: 'N/A', riferimentoClienteIcon: true,
        telefono: 'N/A', telefonoIcon: true,
        email: 'N/A', emailIcon: true,
        interfaccia: 'N/A', interfacciaIcon: true, [field]: value
      } as any
    }));
  };

  const handleServizioChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      servizio: prev.servizio ? { ...prev.servizio, [field]: value } : { cpe: 'N/A', banda: 'N/A', noteIngaggio: '', [field]: value } as any
    }));
  };


  const handleActivityNameChange = (activityId: number, newName: string) => {
    setFormData(prev => ({
        ...prev,
        activities: prev.activities.map(act =>
            act.id === activityId ? { ...act, name: newName } : act
        )
    }));
  };
  
  const handleTechnicalDataChange = (activityId: number, field: keyof TechnicalData, value: string) => {
      setFormData(prev => ({
          ...prev,
          activities: prev.activities.map(act => {
              if (act.id === activityId && act.technicalData) {
                  let updatedTechData = {
                      ...act.technicalData,
                      [field]: value
                  };
                  
                  // Auto calculate Gateway if IP changes
                  if (field === 'ip') {
                      const gw = calculateGateway(value);
                      if (gw) updatedTechData.ipGateway = gw;
                  }

                  // Auto-fill logic for Infrastructure
                  if (field === 'apparatoAttestazioneFibra' && updatedTechData.centraleDiAttestazioneFibra) {
                      const knownPositions = infrastructureData[updatedTechData.centraleDiAttestazioneFibra]?.[value] || [];
                      if (knownPositions.length === 1) {
                          updatedTechData.posizioneApparatoInCentrale = knownPositions[0];
                      }
                  }

                  // Auto-fill logic for Service Termination
                  if (field === 'terminazioneDelServizio') {
                      updatedTechData.tipoConsegna = '';
                      updatedTechData.reteConsegna = '';
                      updatedTechData.apparatoTransportAttestazioneServizio = '';
                      updatedTechData.portaApparatoAttestazioneServizio = '';
                      updatedTechData.apparatoIpNni = '';
                      updatedTechData.idEnriCommand = '';
                      updatedTechData.posizioneApparato = '';
                  } else if (field === 'tipoConsegna') {
                      updatedTechData.reteConsegna = '';
                      updatedTechData.apparatoTransportAttestazioneServizio = '';
                      updatedTechData.portaApparatoAttestazioneServizio = '';
                      updatedTechData.apparatoIpNni = '';
                      updatedTechData.idEnriCommand = '';
                      updatedTechData.posizioneApparato = '';
                  } else if (field === 'reteConsegna') {
                      const central = updatedTechData.terminazioneDelServizio || '';
                      const tipo = updatedTechData.tipoConsegna || '';
                      const config = serviceTerminationData[central]?.[tipo]?.[value];
                      if (config) {
                          updatedTechData.apparatoTransportAttestazioneServizio = config.apparatoTransport || '';
                          updatedTechData.portaApparatoAttestazioneServizio = config.portaApparato || '';
                          updatedTechData.apparatoIpNni = config.apparatoIpNni || '';
                          updatedTechData.idEnriCommand = config.idEnriCommand || '';
                          updatedTechData.posizioneApparato = config.posizioneApparato || '';
                      }
                  }

                  return {
                      ...act,
                      technicalData: updatedTechData
                  };
              }
              return act;
          })
      }));
  };
  
  const handleSitoIntermedioChange = (activityId: number, sIndex: number, field: keyof SitoIntermedio, value: any) => {
      setFormData(prev => ({
          ...prev,
          activities: prev.activities.map(act => {
              if (act.id === activityId && act.technicalData) {
                  const currentSiti = act.technicalData.sitiIntermedi && act.technicalData.sitiIntermedi.length > 0
                      ? [...act.technicalData.sitiIntermedi]
                      : [{
                          id: 'legacy-first',
                          centrale: act.technicalData.centraleDiAttestazioneFibra || '',
                          apparato: act.technicalData.apparatoAttestazioneFibra || '',
                          posizione: act.technicalData.posizioneApparatoInCentrale || '',
                          porta: act.technicalData.portaApparatoAttestazioneFibra || '',
                          attivita: '',
                          patchOttica: true
                      }];

                  if (!currentSiti[sIndex]) {
                      currentSiti[sIndex] = { id: String(Date.now() + sIndex), centrale: '', apparato: '', posizione: '', porta: '', attivita: '', patchOttica: true };
                  }

                  const updatedSito = {
                      ...currentSiti[sIndex],
                      [field]: value
                  };

                  // Reset logic and auto-fill for linked combo fields
                  if (field === 'centrale') {
                      updatedSito.apparato = '';
                      updatedSito.posizione = '';
                      const availableApparats = value && infrastructureData[value] ? Object.keys(infrastructureData[value]) : [];
                      if (availableApparats.length === 1) {
                          updatedSito.apparato = availableApparats[0];
                          const availablePositions = infrastructureData[value]?.[updatedSito.apparato] || [];
                          if (availablePositions.length === 1) {
                              updatedSito.posizione = availablePositions[0];
                          }
                      }
                  } else if (field === 'apparato') {
                      updatedSito.posizione = '';
                      if (updatedSito.centrale && value) {
                          const knownPositions = infrastructureData[updatedSito.centrale]?.[value] || [];
                          if (knownPositions.length === 1) {
                              updatedSito.posizione = knownPositions[0];
                          }
                      }
                  }

                  currentSiti[sIndex] = updatedSito;

                  const firstSito = currentSiti[0];
                  return {
                      ...act,
                      technicalData: {
                          ...act.technicalData,
                          sitiIntermedi: currentSiti,
                          centraleDiAttestazioneFibra: firstSito ? firstSito.centrale : '',
                          apparatoAttestazioneFibra: firstSito ? firstSito.apparato : '',
                          posizioneApparatoInCentrale: firstSito ? firstSito.posizione : '',
                          portaApparatoAttestazioneFibra: firstSito ? firstSito.porta : '',
                      }
                  };
              }
              return act;
          })
      }));
  };

  const handleAddSitoIntermedio = (activityId: number) => {
      setFormData(prev => ({
          ...prev,
          activities: prev.activities.map(act => {
              if (act.id === activityId && act.technicalData) {
                  const currentSiti = act.technicalData.sitiIntermedi && act.technicalData.sitiIntermedi.length > 0
                      ? [...act.technicalData.sitiIntermedi]
                      : [{
                          id: 'legacy-first',
                          centrale: act.technicalData.centraleDiAttestazioneFibra || '',
                          apparato: act.technicalData.apparatoAttestazioneFibra || '',
                          posizione: act.technicalData.posizioneApparatoInCentrale || '',
                          porta: act.technicalData.portaApparatoAttestazioneFibra || '',
                          attivita: '',
                          patchOttica: true
                      }];

                  const newSito: SitoIntermedio = {
                      id: String(Date.now()),
                      centrale: '',
                      apparato: '',
                      posizione: '',
                      porta: '',
                      attivita: '',
                      patchOttica: true
                  };

                  const updatedSiti = [...currentSiti, newSito];
                  const firstSito = updatedSiti[0];

                  return {
                      ...act,
                      technicalData: {
                          ...act.technicalData,
                          sitiIntermedi: updatedSiti,
                          centraleDiAttestazioneFibra: firstSito ? firstSito.centrale : '',
                          apparatoAttestazioneFibra: firstSito ? firstSito.apparato : '',
                          posizioneApparatoInCentrale: firstSito ? firstSito.posizione : '',
                          portaApparatoAttestazioneFibra: firstSito ? firstSito.porta : '',
                      }
                  };
              }
              return act;
          })
      }));
  };

  const handleDeleteSitoIntermedio = (activityId: number, sIndex: number) => {
      setFormData(prev => ({
          ...prev,
          activities: prev.activities.map(act => {
              if (act.id === activityId && act.technicalData) {
                  const currentSiti = act.technicalData.sitiIntermedi && act.technicalData.sitiIntermedi.length > 0
                      ? [...act.technicalData.sitiIntermedi]
                      : [{
                          id: 'legacy-first',
                          centrale: act.technicalData.centraleDiAttestazioneFibra || '',
                          apparato: act.technicalData.apparatoAttestazioneFibra || '',
                          posizione: act.technicalData.posizioneApparatoInCentrale || '',
                          porta: act.technicalData.portaApparatoAttestazioneFibra || '',
                          attivita: '',
                          patchOttica: true
                      }];

                  if (currentSiti.length <= 1) {
                      currentSiti[0] = {
                          id: currentSiti[0].id,
                          centrale: '',
                          apparato: '',
                          posizione: '',
                          porta: '',
                          attivita: '',
                          patchOttica: true
                      };
                  } else {
                      currentSiti.splice(sIndex, 1);
                  }

                  const firstSito = currentSiti[0];

                  return {
                      ...act,
                      technicalData: {
                          ...act.technicalData,
                          sitiIntermedi: currentSiti,
                          centraleDiAttestazioneFibra: firstSito ? firstSito.centrale : '',
                          apparatoAttestazioneFibra: firstSito ? firstSito.apparato : '',
                          posizioneApparatoInCentrale: firstSito ? firstSito.posizione : '',
                          portaApparatoAttestazioneFibra: firstSito ? firstSito.porta : '',
                      }
                  };
              }
              return act;
          })
      }));
  };
  
  const handlePasteTechnicalData = async (activityId: number) => {
    let text = '';
    try {
        text = await navigator.clipboard.readText();
    } catch (err) {
        console.warn("Clipboard API access failed, falling back to prompt:", err);
        // Fallback for when clipboard access is blocked or not supported
        const manualInput = prompt("Impossibile accedere agli appunti. Incolla qui la riga copiata da Excel:");
        if (manualInput) {
            text = manualInput;
        } else {
            return; // User cancelled
        }
    }

    if (!text) {
        alert("Nessun testo trovato.");
        return;
    }

    // Split by lines (take the first non-empty line) and then by tabs
    // Excel usually copies with tab delimiters
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const firstLine = lines[0];
    // Split by tab. If not found, try splitting by multiple spaces?
    // Assuming Excel paste -> Tab separated.
    let parts = firstLine.split('\t');

    // Fallback for simple space separation if tabs are not present but user pasted text with spaces
    if (parts.length < 2 && firstLine.includes(' ')) {
            // Simple heuristics: if no tabs, assume space separated, but this is risky for names with spaces.
            // Sticking to TAB preference or pipe if manually formatted like the user prompt example might imply, 
            // but "prelevato da XLS" implies TABs.
            // Let's try to handle the specific case provided in prompt just in case:
            // 100.64.49.229 | UDINE/...
            if (firstLine.includes('|')) {
                parts = firstLine.split('|');
            }
    }
    
    parts = parts.map(p => p.trim());

    // Mapping: 1: IP, 2: Nome Apparato, 3: Svlan MGT, 4: Svlan PAY
    // We fill as many as we find.
    const newTechData: Partial<TechnicalData> = {};
    if (parts[0]) {
        newTechData.ip = parts[0];
        const gw = calculateGateway(parts[0]);
        if (gw) newTechData.ipGateway = gw;
    }
    if (parts[1]) newTechData.nomeApparato = parts[1];
    if (parts[2]) newTechData.svlanMgt = parts[2];
    if (parts[3]) newTechData.svlanPay = parts[3];

    setFormData(prev => ({
        ...prev,
        activities: prev.activities.map(act => {
            if (act.id === activityId && act.technicalData) {
                return {
                    ...act,
                    technicalData: {
                        ...act.technicalData,
                        ...newTechData
                    }
                };
            }
            return act;
        })
    }));
  };

  const handleAddActivity = () => {
    const newActivity: Activity = {
      id: Date.now(), 
      name: '',
      completed: false,
    };
    setFormData(prev => ({ ...prev, activities: [...prev.activities, newActivity] }));
  };

  const handleDuplicateActivity = (activityId: number) => {
      const activityToDuplicate = formData.activities.find(a => a.id === activityId);
      if (!activityToDuplicate) return;

      const newActivity: Activity = {
          ...activityToDuplicate,
          id: Date.now(),
          name: `${activityToDuplicate.name} (Copia)`,
          completed: false,
          completedAt: null,
          subTask: activityToDuplicate.subTask ? { ...activityToDuplicate.subTask, completed: false, completedAt: null } : undefined,
          technicalData: activityToDuplicate.technicalData ? { 
              ip: '', 
              ipGateway: '', 
              svlanMgt: '', 
              svlanPay: '', 
              nomeApparato: '', 
              centraleDiAttestazioneFibra: '',
              apparatoAttestazioneFibra: '',
              portaApparatoAttestazioneFibra: '',
              posizioneApparatoInCentrale: '',
              centraleDiAttestazioneMgt: '',
              terminazioneDelServizio: '',
              apparatoTransportAttestazioneServizio: '',
              portaApparatoAttestazioneServizio: '',
              portaApparatoCliente: 'P01',
              apparatoIpNni: '',
              lunghezzaOttica: '',
              attenuazioneMaxDb: '',
              posizioneCassettoFibra: '',
              posizioneApparato: '',
          } : undefined
      };
      
      const index = formData.activities.findIndex(a => a.id === activityId);
      const newActivities = [...formData.activities];
      newActivities.splice(index + 1, 0, newActivity);
      
      setFormData(prev => ({ ...prev, activities: newActivities }));
  };

  const handleDeleteActivity = (activityId: number) => {
    setFormData(prev => ({ ...prev, activities: prev.activities.filter(act => act.id !== activityId) }));
  };
  
  const handleSave = () => {
    onUpdateProject(project.id, formData);
  };

  // Define which activities are "Configuration/Technical" vs "Standard/Workflow"
  // ID 1 = Configurazione IP di MGT
  const isConfigActivity = (activity: Activity) => {
      const baseId = activity.originalId ?? activity.id;
      return baseId === 1;
  };

  const configActivities = formData.activities.filter(isConfigActivity);
  const standardActivities = formData.activities.filter(a => !isConfigActivity(a));

  const renderActivityItem = (activity: Activity, originalIndex: number) => (
    <div key={activity.id} className="p-3 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
            <input 
                type="text"
                value={activity.name}
                onChange={(e) => handleActivityNameChange(activity.id, e.target.value)}
                placeholder={`Nuova attività ${originalIndex + 1}`}
                className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-bold text-slate-700 dark:text-slate-200"
            />
            {activity.name.trim().toLowerCase() !== 'progetto chiuso' && (
                <>
                    <button 
                        onClick={() => handleDuplicateActivity(activity.id)}
                        title="Duplica attività (crea nuova riga tecnica)"
                        className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <DocumentDuplicateIcon className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => handleDeleteActivity(activity.id)}
                        title="Elimina attività"
                        className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </button>
                </>
            )}
        </div>
        
        {/* Inline Technical Data Editing */}
        {activity.technicalData && (
            <div className="mt-3 pl-3 border-l-4 border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-r-md">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide flex items-center gap-1">
                        Dati Tecnici
                    </span>
                    <button
                        type="button"
                        onClick={() => handlePasteTechnicalData(activity.id)}
                        title="Incolla da Excel (IP | Nome Apparato | MGT | PAY)"
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 bg-white hover:bg-indigo-50 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800 rounded border border-indigo-200 dark:border-indigo-700 transition-colors shadow-sm"
                    >
                        <ClipboardIcon className="h-3 w-3" />
                        Incolla da Excel
                    </button>
                </div>
                <div className="space-y-4">
                    {/* Row 1: Apparato */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Apparato</label>
                            <input 
                                type="text"
                                value={activity.technicalData.nomeApparato || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'nomeApparato', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Hostname"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo Apparato</label>
                            <select
                                value={activity.technicalData.tipoApparato || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'tipoApparato', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Seleziona...</option>
                                <option value="ALBIS 2102">ALBIS 2102</option>
                                <option value="7090 LO Cem">7090 LO Cem</option>
                            </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Porta Apparato Cliente</label>
                           <select
                                value={activity.technicalData.portaApparatoCliente || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'portaApparatoCliente', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Seleziona...</option>
                                {PORTA_APPARATO_CLIENTE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: IP */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IP Rete (/30)</label>
                            <input 
                                type="text"
                                value={calculateNetworkIp(activity.technicalData.ip)}
                                disabled
                                className="w-full px-2 py-1.5 text-sm bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded font-mono"
                                placeholder="Calcolato"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IP Apparato</label>
                            <input 
                                type="text"
                                value={activity.technicalData.ip}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'ip', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="192.168.x.x"
                            />
                        </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">IP Gateway</label>
                            <input 
                                type="text"
                                value={activity.technicalData.ipGateway || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'ipGateway', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                placeholder="IP + 1"
                            />
                        </div>
                    </div>
                    
                    {/* Row 3: Sito Intermedio */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                Sito Intermedio
                            </span>
                            <button
                                type="button"
                                onClick={() => handleAddSitoIntermedio(activity.id)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm"
                            >
                                <PlusCircleIcon className="h-3.5 w-3.5" />
                                Aggiungi Sito Intermedio
                            </button>
                        </div>

                        {(() => {
                            const siti = activity.technicalData.sitiIntermedi && activity.technicalData.sitiIntermedi.length > 0
                                ? activity.technicalData.sitiIntermedi
                                : [{
                                    id: 'legacy-first',
                                    centrale: activity.technicalData.centraleDiAttestazioneFibra || '',
                                    apparato: activity.technicalData.apparatoAttestazioneFibra || '',
                                    posizione: activity.technicalData.posizioneApparatoInCentrale || '',
                                    porta: activity.technicalData.portaApparatoAttestazioneFibra || '',
                                    attivita: ''
                                }];

                            return (
                                <div className="space-y-4">
                                    {siti.map((sito, sIndex) => {
                                        const availableCentrals = Array.from(new Set([
                                            ...Object.keys(infrastructureData),
                                            ...(sito.centrale ? [sito.centrale] : [])
                                        ])).sort();

                                        const availableApparates = sito.centrale && infrastructureData[sito.centrale]
                                            ? Array.from(new Set([
                                                ...Object.keys(infrastructureData[sito.centrale]),
                                                ...(sito.apparato ? [sito.apparato] : [])
                                            ])).sort()
                                            : Array.from(new Set([
                                                ...TIPO_APPARATI,
                                                ...(sito.apparato ? [sito.apparato] : [])
                                            ])).sort();

                                        const availablePositions = sito.centrale && sito.apparato && infrastructureData[sito.centrale]?.[sito.apparato]
                                            ? Array.from(new Set([
                                                ...(infrastructureData[sito.centrale][sito.apparato] || []),
                                                ...(sito.posizione ? [sito.posizione] : [])
                                            ])).sort()
                                            : (sito.posizione ? [sito.posizione] : []);

                                        return (
                                            <div key={sito.id || sIndex} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md relative shadow-sm">
                                                {siti.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSitoIntermedio(activity.id, sIndex)}
                                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                                                        title="Elimina questo sito intermedio"
                                                    >
                                                        <XCircleIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                                                    Sito Intermedio {siti.length > 1 ? `#${sIndex + 1}` : ''}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Centrale Attestazione Fibra</label>
                                                        <select
                                                            value={sito.centrale || ''}
                                                            onChange={(e) => handleSitoIntermedioChange(activity.id, sIndex, 'centrale', e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">Seleziona Centrale...</option>
                                                            {availableCentrals.map(c => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Apparato Attestazione Fibra</label>
                                                        <select
                                                            value={sito.apparato || ''}
                                                            onChange={(e) => handleSitoIntermedioChange(activity.id, sIndex, 'apparato', e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">Seleziona Apparato...</option>
                                                            {availableApparates.map(a => (
                                                                <option key={a} value={a}>{a}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Posizione Apparato in Centrale</label>
                                                        <select
                                                            value={sito.posizione || ''}
                                                            onChange={(e) => handleSitoIntermedioChange(activity.id, sIndex, 'posizione', e.target.value)}
                                                            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="">Seleziona Posizione...</option>
                                                            {availablePositions.map(p => (
                                                                <option key={p} value={p}>{p}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Porta Apparato Attestazione Fibra</label>
                                                    <input 
                                                        type="text"
                                                        value={sito.porta || ''}
                                                        onChange={(e) => handleSitoIntermedioChange(activity.id, sIndex, 'porta', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Porta"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 flex flex-col gap-1">
                                                    <label htmlFor={`patch-ottica-${activity.id}-${sIndex}`} className="block text-[10px] font-bold text-slate-500 uppercase">
                                                        Prevista patch ottica tra porta apparato e cassetto ottico?
                                                    </label>
                                                    <select
                                                        id={`patch-ottica-${activity.id}-${sIndex}`}
                                                        value={sito.patchOttica !== false ? 'si' : 'no'}
                                                        onChange={(e) => handleSitoIntermedioChange(activity.id, sIndex, 'patchOttica', e.target.value === 'si')}
                                                        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="si">Sì</option>
                                                        <option value="no">No</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attività nel sito intermedio (note)</label>
                                                    <input 
                                                        type="text"
                                                        value={sito.attivita || ''}
                                                        onChange={(e) => handleSitoIntermedioChange(activity.id, sIndex, 'attivita', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Esempio: fare patch, inserire SFP, etc."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Row 4: MGT & Payload VLAN */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Centrale Terminazione MGT</label>
                            <select
                                value={activity.technicalData.centraleDiAttestazioneMgt || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'centraleDiAttestazioneMgt', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Seleziona...</option>
                                {MGT_CENTRALS.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SVLAN MGT</label>
                            <input 
                                type="text"
                                value={activity.technicalData.svlanMgt}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'svlanMgt', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Vlan ID"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SVLAN PAY</label>
                            <input 
                                type="text"
                                value={activity.technicalData.svlanPay}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'svlanPay', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Payload Vlan"
                            />
                        </div>
                    </div>
                    
                    {/* Row 5: Servizio */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Centrale Terminazione Servizio</label>
                            <select
                                value={activity.technicalData.terminazioneDelServizio || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'terminazioneDelServizio', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Seleziona Centrale...</option>
                                {Object.keys(serviceTerminationData).sort().map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo di Consegna</label>
                            <select
                                value={activity.technicalData.tipoConsegna || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'tipoConsegna', e.target.value)}
                                disabled={!activity.technicalData.terminazioneDelServizio}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                            >
                                <option value="">Seleziona Tipo...</option>
                                {activity.technicalData.terminazioneDelServizio && serviceTerminationData[activity.technicalData.terminazioneDelServizio] && 
                                    Object.keys(serviceTerminationData[activity.technicalData.terminazioneDelServizio]).sort().map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rete di Consegna</label>
                            <select
                                value={activity.technicalData.reteConsegna || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'reteConsegna', e.target.value)}
                                disabled={!activity.technicalData.tipoConsegna}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                            >
                                <option value="">Seleziona Rete...</option>
                                {activity.technicalData.terminazioneDelServizio && activity.technicalData.tipoConsegna && 
                                    serviceTerminationData[activity.technicalData.terminazioneDelServizio]?.[activity.technicalData.tipoConsegna] && 
                                    Object.keys(serviceTerminationData[activity.technicalData.terminazioneDelServizio][activity.technicalData.tipoConsegna]).sort().map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Apparato Transport Attestazione Servizio</label>
                            <input 
                                type="text"
                                readOnly
                                value={activity.technicalData.apparatoTransportAttestazioneServizio || ''}
                                className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none font-medium text-slate-600 dark:text-slate-400"
                                placeholder="Auto-compilato"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Porta Apparato Attestazione Servizio</label>
                            <input 
                                type="text"
                                readOnly
                                value={activity.technicalData.portaApparatoAttestazioneServizio || ''}
                                className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none font-medium text-slate-600 dark:text-slate-400"
                                placeholder="Auto-compilato"
                            />
                        </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Apparato IP (NNI)</label>
                           <input 
                                type="text"
                                readOnly
                                value={activity.technicalData.apparatoIpNni || ''}
                                className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none font-medium text-slate-600 dark:text-slate-400"
                                placeholder="Auto-compilato"
                            />
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ID (ENRI/Command)</label>
                           <input 
                                type="text"
                                readOnly
                                value={activity.technicalData.idEnriCommand || ''}
                                className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none font-medium text-slate-600 dark:text-slate-400"
                                placeholder="Auto-compilato"
                            />
                        </div>
                        <div>
                           <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Posizione Apparato</label>
                           <input 
                                type="text"
                                readOnly
                                value={activity.technicalData.posizioneApparato || ''}
                                className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none font-medium text-slate-600 dark:text-slate-400"
                                placeholder="Auto-compilato"
                            />
                        </div>
                     </div>
                      {/* Row 6: Schema Collegamento */}
                     <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800 mt-4">
                        <h4 className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2">Schema Collegamento</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Lunghezza Ottica</label>
                            <input 
                                type="text"
                                value={activity.technicalData.lunghezzaOttica || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'lunghezzaOttica', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., 4355"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attenuazione MAX (Db)</label>
                            <input 
                                type="text"
                                value={activity.technicalData.attenuazioneMaxDb || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'attenuazioneMaxDb', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., 2.05"
                            />
                          </div>
                           <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Posizione Cassetto Fibra</label>
                            <input 
                                type="text"
                                value={activity.technicalData.posizioneCassettoFibra || ''}
                                onChange={(e) => handleTechnicalDataChange(activity.id, 'posizioneCassettoFibra', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Posizione cassetto"
                            />
                          </div>
                        </div>
                     </div>
                </div>
            </div>
        )}
    </div>
  );

  const [isMouseDownOnBackdrop, setIsMouseDownOnBackdrop] = useState(false);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMouseDownOnBackdrop(true);
    } else {
      setIsMouseDownOnBackdrop(false);
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (isMouseDownOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
    setIsMouseDownOnBackdrop(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Modifica Progetto: <span className="font-bold text-blue-600 dark:text-blue-400">{project.id}</span>
          </h2>
        </header>

        <main className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Numero CRQ</label>
                    <input type="text" id="id" name="id" value={formData.id} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                </div>
                 <div>
                    <label htmlFor="ragioneSociale" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ragione Sociale</label>
                    <input type="text" id="ragioneSociale" name="ragioneSociale" value={formData.ragioneSociale} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                </div>
            </div>
            <div>
                <label htmlFor="riepilogo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Riepilogo</label>
                <textarea id="riepilogo" name="riepilogo" value={formData.riepilogo || ''} onChange={handleInputChange} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="via" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Via</label>
                    <input type="text" id="via" name="via" value={formData.via} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                </div>
                 <div>
                    <label htmlFor="citta" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Città</label>
                    <input type="text" id="citta" name="citta" value={formData.citta} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="referente" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referente</label>
                    <input type="text" id="referente" name="referente" value={formData.riferimentoSede.referente || ''} onChange={handleRiferimentoChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                </div>
                 <div>
                    <label htmlFor="tel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefono</label>
                    <input type="tel" id="tel" name="tel" value={formData.riferimentoSede.tel || ''} onChange={handleRiferimentoChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
                </div>
            </div>
             <div>
                <label htmlFor="responsabileProgetto" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsabile del Progetto</label>
                <select 
                    id="responsabileProgetto" 
                    name="responsabileProgetto" 
                    value={formData.responsabileProgetto || ''} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                >
                    <option value="">Seleziona...</option>
                    <option value="Bonfiglio Melchiorre">Bonfiglio Melchiorre</option>
                    <option value="N/A">N/A</option>
                </select>
            </div>
             <div>
                <label htmlFor="operazioniNecessarie" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Operazioni Necessarie</label>
                <textarea id="operazioniNecessarie" name="operazioniNecessarie" value={formData.operazioniNecessarie || ''} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
            </div>
             <div>
                <label htmlFor="note" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note (Promemoria interno)</label>
                <textarea id="note" name="note" value={formData.note || ''} onChange={handleInputChange} rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />
            </div>

            {/* 4 Step Extracted Data Editing Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/10">
              <button
                type="button"
                onClick={() => setIsDatiOrdineExpanded(!isDatiOrdineExpanded)}
                className="flex items-center justify-between w-full font-semibold text-sm text-slate-700 dark:text-slate-300"
              >
                <span>Modifica Dati Estratti (Ordine & Siti - 4 Step)</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  {isDatiOrdineExpanded ? 'Nascondi' : 'Mostra / Modifica'}
                </span>
              </button>

              {isDatiOrdineExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-6">
                  {/* Step 1: Ordine */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Step 1: Inserisci i Dati Ordine</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ID ODF</label>
                        <input
                          type="text"
                          value={formData.ordine?.idOdf || ''}
                          onChange={(e) => handleOrdineChange('idOdf', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ID ORDINE</label>
                        <input
                          type="text"
                          value={formData.ordine?.idOrdine || ''}
                          onChange={(e) => handleOrdineChange('idOrdine', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">TIPO</label>
                        <input
                          type="text"
                          value={formData.ordine?.tipo || ''}
                          onChange={(e) => handleOrdineChange('tipo', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Sito A */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 2: SITO A</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipologia Sito</label>
                        <input
                          type="text"
                          value={formData.sitoA?.tipologiaSito || ''}
                          onChange={(e) => handleSitoAChange('tipologiaSito', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Indirizzo</label>
                        <input
                          type="text"
                          value={formData.sitoA?.indirizzo || ''}
                          onChange={(e) => handleSitoAChange('indirizzo', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Città</label>
                        <input
                          type="text"
                          value={formData.sitoA?.citta || ''}
                          onChange={(e) => handleSitoAChange('citta', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Acronimo</label>
                        <input
                          type="text"
                          value={formData.sitoA?.acronimo || ''}
                          onChange={(e) => handleSitoAChange('acronimo', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Riferimento Cliente</label>
                        <input
                          type="text"
                          value={formData.sitoA?.riferimentoCliente || ''}
                          onChange={(e) => handleSitoAChange('riferimentoCliente', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telefono</label>
                        <input
                          type="text"
                          value={formData.sitoA?.telefono || ''}
                          onChange={(e) => handleSitoAChange('telefono', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E-mail</label>
                        <input
                          type="text"
                          value={formData.sitoA?.email || ''}
                          onChange={(e) => handleSitoAChange('email', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Interfaccia</label>
                        <input
                          type="text"
                          value={formData.sitoA?.interfaccia || ''}
                          onChange={(e) => handleSitoAChange('interfaccia', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Sito Z */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step 3: SITO Z</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tipologia Sito</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.tipologiaSito || ''}
                          onChange={(e) => handleSitoZChange('tipologiaSito', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Indirizzo</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.indirizzo || ''}
                          onChange={(e) => handleSitoZChange('indirizzo', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Città</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.citta || ''}
                          onChange={(e) => handleSitoZChange('citta', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Acronimo</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.acronimo || ''}
                          onChange={(e) => handleSitoZChange('acronimo', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Riferimento Cliente</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.riferimentoCliente || ''}
                          onChange={(e) => handleSitoZChange('riferimentoCliente', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telefono</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.telefono || ''}
                          onChange={(e) => handleSitoZChange('telefono', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E-mail</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.email || ''}
                          onChange={(e) => handleSitoZChange('email', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Interfaccia</label>
                        <input
                          type="text"
                          value={formData.sitoZ?.interfaccia || ''}
                          onChange={(e) => handleSitoZChange('interfaccia', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Servizio */}
                  <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Step 4: SERVIZIO</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CPE</label>
                        <input
                          type="text"
                          value={formData.servizio?.cpe || ''}
                          onChange={(e) => handleServizioChange('cpe', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">BANDA</label>
                        <input
                          type="text"
                          value={formData.servizio?.banda || ''}
                          onChange={(e) => handleServizioChange('banda', e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Note per l'Ingaggio Opzionale</label>
                      <textarea
                        value={formData.servizio?.noteIngaggio || ''}
                        onChange={(e) => handleServizioChange('noteIngaggio', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>


            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-4">Attività e Configurazioni</h3>
                
                {/* Top Section: Configurations (Fibra & IP) - Detached from bottom list */}
                {configActivities.length > 0 && (
                    <div className="mb-6 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-200 dark:border-slate-600 pb-2">
                            Configurazioni Iniziali & Dati Tecnici
                        </h4>
                        <div className="space-y-4">
                            {configActivities.map((activity) => 
                                renderActivityItem(activity, formData.activities.indexOf(activity))
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom Section: Workflow/Standard Activities */}
                <div className="space-y-4">
                    {standardActivities.length > 0 && (
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                             Fasi Operative
                         </h4>
                    )}
                    {standardActivities.map((activity) => 
                        renderActivityItem(activity, formData.activities.indexOf(activity))
                    )}
                </div>

                <button
                    onClick={handleAddActivity}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-500 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                    <PlusCircleIcon className="h-5 w-5" />
                    <span>Aggiungi Attività Generica</span>
                </button>
            </div>

        <footer className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            Annulla
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition shadow-sm"
          >
            Salva Modifiche
          </button>
        </footer>
        </main>
      </div>
    </div>
  );
};

export default EditProjectModal;
