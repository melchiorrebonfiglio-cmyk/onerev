
import React, { useMemo } from 'react';
import { Project, Activity, SubTask, Sito } from '../types';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { UserIcon } from './icons/UserIcon';
import { ServerStackIcon } from './icons/ServerStackIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { generatePpt } from '../utils/pptGenerator';

interface ToDoActivity {
  id: number;
  name: string;
  completed: boolean;
  subTask?: SubTask;
  idCommand?: string;
  namingServizio?: string;
  materialsImage?: string;
  materialsText?: string;
  materialsTable?: { codice: string; descrizione: string; quantita: string }[];
}

interface GroupedToDoItem {
  projectId: string;
  projectRagioneSociale: string;
  projectVia: string;
  projectCitta: string;
  activities: ToDoActivity[];
  customerSite?: Sito | null;
}

interface ProjectsToDoViewProps {
  projects: Project[];
  filterTerm: string;
  onSelectProject: (projectId: string) => void;
  onToggleActivity: (
    projectId: string, 
    activityId: number, 
    extraData?: { 
      idCommand?: string; 
      namingServizio?: string;
      materialsImage?: string;
      materialsText?: string;
      materialsTable?: { codice: string; descrizione: string; quantita: string }[];
    }
  ) => void;
  onToggleSubTask: (projectId: string, activityId: number) => void;
}

const ProjectsToDoView: React.FC<ProjectsToDoViewProps> = ({ projects, filterTerm, onSelectProject, onToggleActivity, onToggleSubTask }) => {

  const [generatingPptIds, setGeneratingPptIds] = React.useState<Record<string, boolean>>({});

  const handleGeneratePpt = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    await generatePpt(project, (val) => {
      setGeneratingPptIds(prev => ({ ...prev, [projectId]: val }));
    });
  };

  const [commandModal, setCommandModal] = React.useState<{
    projectId: string;
    activityId: number;
    idCommand: string;
    namingServizio: string;
  } | null>(null);

  const [materialsModal, setMaterialsModal] = React.useState<{
    projectId: string;
    activityId: number;
    materialsImage: string;
    materialsText: string;
    materialsTable: { codice: string; descrizione: string; quantita: string }[];
  } | null>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [extractError, setExtractError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                processFile(file);
            }
        }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = reader.result as string;
        setMaterialsModal(prev => {
            if (!prev) return null;
            return {
                ...prev,
                materialsImage: base64
            };
        });
        extractMaterialsFromImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const extractMaterialsFromImage = async (base64Data: string, mimeType: string) => {
    setIsExtracting(true);
    setExtractError(null);
    try {
        const cleanBase64 = base64Data.split(',')[1] || base64Data;
        const res = await fetch("/api/gemini/extract-materials", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                imageBase64: cleanBase64,
                mimeType
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Errore sconosciuto del server");
        }

        const data = await res.json();
        setMaterialsModal(prev => {
            if (!prev) return null;
            return {
                ...prev,
                materialsText: data.rawText || '',
                materialsTable: data.table || []
            };
        });
    } catch (err: any) {
        console.error("Extraction error:", err);
        setExtractError("Non siamo riusciti ad estrarre il testo dall'immagine tramite AI, ma l'immagine è stata caricata correttamente.");
    } finally {
        setIsExtracting(false);
    }
  };

  const groupedTodoItems = useMemo(() => {
    const items: GroupedToDoItem[] = [];

    projects.forEach(p => {
        if (p.status !== 'on going') return;

        // Get all activities for the project (completed and incomplete) to keep them visible and reversible
        const projectActivities = p.activities.map(a => ({ 
            id: a.id, 
            name: a.name, 
            completed: a.completed,
            subTask: a.subTask,
            idCommand: a.idCommand,
            namingServizio: a.namingServizio,
            materialsImage: a.materialsImage,
            materialsText: a.materialsText,
            materialsTable: a.materialsTable
        }));

        // Finalize: if the project has activities, add it to the list.
        if (projectActivities.length > 0) {
            const sites = [];
            if (p.sitoA) sites.push(p.sitoA);
            if (p.sitoZ) sites.push(p.sitoZ);
            
            // Look for site where tipologiaSito matches "COLOCATIONCUSTMERSITE" (case-insensitive and whitespace-stripped)
            const exactMatch = sites.find(s => {
              const typeClean = s.tipologiaSito?.toLowerCase().replace(/[^a-z0-9]/g, '');
              return typeClean === 'colocationcustmersite' || typeClean === 'colocationcustomersite';
            });
            
            let foundCustomerSite = exactMatch;
            if (!foundCustomerSite) {
              // Look for site where tipologiaSito includes 'colocation' or 'customer' or 'cliente'
              foundCustomerSite = sites.find(s => {
                const typeLower = s.tipologiaSito?.toLowerCase() || '';
                return typeLower.includes('colocation') || typeLower.includes('cust') || typeLower.includes('client');
              });
            }

            items.push({
                projectId: p.id,
                projectRagioneSociale: p.ragioneSociale,
                projectVia: p.via,
                projectCitta: p.citta,
                activities: projectActivities,
                customerSite: foundCustomerSite || null
            });
        }
    });
    return items;
  }, [projects]);

  const filteredTodoItems = useMemo(() => {
    if (!filterTerm.trim()) {
        return groupedTodoItems;
    }
    const lowercasedFilter = filterTerm.toLowerCase();
    return groupedTodoItems.filter(item =>
        item.projectId.toLowerCase().includes(lowercasedFilter) ||
        item.projectRagioneSociale.toLowerCase().includes(lowercasedFilter)
    );
  }, [groupedTodoItems, filterTerm]);
  
  if (groupedTodoItems.length === 0 && !filterTerm) {
    return (
      <div className="mt-16 text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md">
        <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500" />
        <h2 className="mt-4 text-2xl font-semibold text-slate-500 dark:text-slate-400">Nessuna attività "DA FARE" in corso.</h2>
        <p className="mt-2 text-slate-400 dark:text-slate-500">
          Tutte le attività principali sono state completate o non ci sono progetti attivi.
        </p>
      </div>
    );
  }

  return (
    <div>
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Lista Generale TO DO
            </h2>
        </div>
        
        {filteredTodoItems.length === 0 && filterTerm ? (
             <div className="mt-16 text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md">
                <h2 className="mt-4 text-2xl font-semibold text-slate-500 dark:text-slate-400">Nessun progetto trovato per la ricerca.</h2>
                <p className="mt-2 text-slate-400 dark:text-slate-500">
                  Prova a modificare i termini di ricerca o a pulire il filtro.
                </p>
              </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTodoItems.map((item) => (
                    <div 
                        key={item.projectId}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 flex flex-col justify-between border-l-4 border-amber-500"
                    >
                        <div className="flex-grow">
                            <div className="flex justify-between items-start mb-4 gap-2">
                                <div 
                                    onClick={() => onSelectProject(item.projectId)} 
                                    className="cursor-pointer group flex-grow min-w-0"
                                    title="Visualizza dettagli progetto"
                                >
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{item.projectId}</h3>
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">{item.projectRagioneSociale}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleGeneratePpt(item.projectId);
                                    }}
                                    disabled={generatingPptIds[item.projectId]}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-md transition disabled:opacity-50 disabled:cursor-wait shadow-sm flex-shrink-0"
                                    title="Genera PPT"
                                >
                                    <DocumentTextIcon className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>{generatingPptIds[item.projectId] ? '...' : 'PPT'}</span>
                                </button>
                            </div>

                            {(item.projectVia || item.projectCitta) && (
                                <div className="flex items-start text-xs text-slate-500 dark:text-slate-400 mb-4">
                                    <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span>{item.projectVia}, {item.projectCitta}</span>
                                </div>
                            )}

                            {item.customerSite && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-md text-xs space-y-2">
                                    <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 font-semibold mb-1">
                                        <ServerStackIcon className="h-3.5 w-3.5" />
                                        <span>{item.customerSite.tipologiaSito || 'Colocation Customer Site'}</span>
                                    </div>
                                    
                                    {item.customerSite.indirizzo && (
                                        <div className="flex items-start text-slate-600 dark:text-slate-300">
                                            <MapPinIcon className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-slate-400" />
                                            <span>
                                                {item.customerSite.indirizzo}, {item.customerSite.citta} 
                                                {item.customerSite.acronimo ? ` (${item.customerSite.acronimo})` : ''}
                                            </span>
                                        </div>
                                    )}

                                    {(item.customerSite.riferimentoCliente || item.customerSite.telefono || item.customerSite.email) && (
                                        <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5 mt-1.5 space-y-1">
                                            {item.customerSite.riferimentoCliente && (
                                                <div className="flex items-center text-slate-600 dark:text-slate-300">
                                                    <UserIcon className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                    <span className="font-medium">{item.customerSite.riferimentoCliente}</span>
                                                </div>
                                            )}
                                            {item.customerSite.telefono && (
                                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                                    <PhoneIcon className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                    <span>{item.customerSite.telefono}</span>
                                                </div>
                                            )}
                                            {item.customerSite.email && (
                                                <div className="flex items-center text-slate-500 dark:text-slate-400">
                                                    <EnvelopeIcon className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate">{item.customerSite.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {item.customerSite.interfaccia && (
                                        <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5 mt-1 text-slate-500 dark:text-slate-400">
                                            <span className="font-semibold text-slate-600 dark:text-slate-300">Interfaccia: </span>
                                            <span>{item.customerSite.interfaccia}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                {item.activities.map(activity => {
                                    const isParentDisabled = !!activity.subTask && activity.completed;
                                    return (
                                        <div key={activity.id} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors">
                                            <div className="flex items-center justify-between group">
                                                <label className={`flex items-center flex-grow min-w-0 ${isParentDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                    <div className="relative h-5 w-5 flex-shrink-0">
                                                        <input 
                                                            type="checkbox"
                                                            checked={activity.completed}
                                                            disabled={isParentDisabled}
                                                            onChange={() => {
                                                                if (activity.id === 3 && !activity.completed) {
                                                                    setCommandModal({
                                                                        projectId: item.projectId,
                                                                        activityId: activity.id,
                                                                        idCommand: activity.idCommand || '',
                                                                        namingServizio: activity.namingServizio || ''
                                                                    });
                                                                } else if (activity.id === 5 && !activity.completed) {
                                                                    setMaterialsModal({
                                                                        projectId: item.projectId,
                                                                        activityId: activity.id,
                                                                        materialsImage: activity.materialsImage || '',
                                                                        materialsText: activity.materialsText || '',
                                                                        materialsTable: activity.materialsTable || []
                                                                    });
                                                                } else {
                                                                    onToggleActivity(item.projectId, activity.id);
                                                                }
                                                            }}
                                                            className="peer absolute h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                        />
                                                        <div className={`
                                                            pointer-events-none
                                                            h-full w-full rounded border-2
                                                            flex items-center justify-center
                                                            transition-colors duration-200
                                                            bg-white dark:bg-slate-700
                                                            border-slate-300 dark:border-slate-600
                                                            peer-checked:border-green-600 peer-checked:bg-green-600
                                                            peer-focus:ring-2 peer-focus:ring-blue-500
                                                            peer-disabled:opacity-50
                                                            ${!isParentDisabled ? 'group-hover:border-blue-500 dark:group-hover:border-blue-400' : ''}
                                                        `}>
                                                            <svg
                                                                className="h-3.5 w-3.5 text-white hidden peer-checked:block"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                                aria-hidden="true"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <span className={`ml-3 text-sm truncate font-medium ${activity.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'} ${!isParentDisabled ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400' : ''} transition-colors`}>
                                                        {activity.name}
                                                    </span>
                                                </label>
                                            </div>
                                            
                                            {activity.id === 3 && (activity.idCommand || activity.namingServizio) && (
                                                <div className="mt-1.5 ml-8 p-2 bg-slate-50 dark:bg-slate-900/40 rounded border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono">
                                                    {activity.idCommand && (
                                                        <div>
                                                            <span className="text-slate-400">ID Command:</span>{' '}
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.idCommand}</span>
                                                        </div>
                                                    )}
                                                    {activity.namingServizio && (
                                                        <div>
                                                            <span className="text-slate-400">Naming Servizio:</span>{' '}
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.namingServizio}</span>
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCommandModal({
                                                                projectId: item.projectId,
                                                                activityId: activity.id,
                                                                idCommand: activity.idCommand || '',
                                                                namingServizio: activity.namingServizio || ''
                                                            });
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-[10px] font-semibold underline block pt-1"
                                                    >
                                                        Modifica Dati Command
                                                    </button>
                                                </div>
                                            )}

                                            {activity.subTask && (
                                                <div className="pl-8 pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                    <label className="flex items-center cursor-pointer">
                                                        <div className="relative h-5 w-5 flex-shrink-0">
                                                            <input 
                                                                type="checkbox"
                                                                checked={activity.subTask.completed}
                                                                onChange={() => onToggleSubTask(item.projectId, activity.id)}
                                                                className="peer absolute h-full w-full opacity-0 cursor-pointer"
                                                            />
                                                            <div className="pointer-events-none h-full w-full rounded border-2 flex items-center justify-center transition-colors duration-200 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 peer-checked:border-sky-600 peer-checked:bg-sky-600 peer-focus:ring-2 peer-focus:ring-blue-500">
                                                                <svg
                                                                    className="h-3.5 w-3.5 text-white hidden peer-checked:block"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                    aria-hidden="true"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className={`ml-3 text-xs font-semibold ${activity.subTask.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'} transition-colors`}>
                                                            {activity.subTask.name}
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {commandModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 transform transition-all scale-100">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Dati Documentazione Command
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        Inserisci i dettagli relativi alla documentazione dei servizi in Command per il progetto {commandModal.projectId}.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                ID Command
                            </label>
                            <input
                                type="text"
                                value={commandModal.idCommand}
                                onChange={(e) => setCommandModal({ ...commandModal, idCommand: e.target.value })}
                                placeholder="Esempio: CAC 940367"
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Naming Del Servizio
                            </label>
                            <input
                                type="text"
                                value={commandModal.namingServizio}
                                onChange={(e) => setCommandModal({ ...commandModal, namingServizio: e.target.value })}
                                placeholder="Esempio: San Donato - SAN DONATO M/ABG-LO..."
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setCommandModal(null)}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onToggleActivity(commandModal.projectId, commandModal.activityId, {
                                    idCommand: commandModal.idCommand,
                                    namingServizio: commandModal.namingServizio
                                });
                                setCommandModal(null);
                            }}
                            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition"
                        >
                            Salva e Completa
                        </button>
                    </div>
                </div>
            </div>
        )}

        {materialsModal && (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                onPaste={handlePaste}
            >
                <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden transform transition-all scale-100">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                Prenotazione Lista Materiali
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Incolla (Ctrl+V) o trascina l'immagine dell'ordine di prenotazione. L'AI estrarrà automaticamente la lista materiali in tabella.
                            </p>
                        </div>
                        <button 
                            onClick={() => setMaterialsModal(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 overflow-y-auto pr-1">
                        {/* LEFT COLUMN: Image drop / preview zone */}
                        <div className="flex flex-col space-y-4">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Immagine Intestazione Ordine
                            </span>

                            {!materialsModal.materialsImage ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer text-center transition min-h-[250px] ${
                                        isDragging 
                                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20" 
                                            : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-900/50"
                                    }`}
                                >
                                    <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Fai click per caricare, trascina qui, oppure...
                                    </p>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-1 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-md inline-block">
                                        Incolla direttamente l'immagine (Ctrl+V)
                                    </p>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                </div>
                            ) : (
                                <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 min-h-[250px] flex items-center justify-center">
                                    <img 
                                        src={materialsModal.materialsImage} 
                                        alt="Preview Ordine" 
                                        className="max-h-[300px] object-contain w-full"
                                        referrerPolicy="no-referrer"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMaterialsModal(prev => prev ? { ...prev, materialsImage: '', materialsText: '', materialsTable: [] } : null)}
                                        className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg shadow-md text-xs font-semibold"
                                        title="Rimuovi immagine"
                                    >
                                        ✕ Rimuovi
                                    </button>
                                </div>
                            )}

                            {/* Header details text block */}
                            <div className="flex flex-col space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Dettagli Intestazione (Estratti da AI)
                                </label>
                                <textarea
                                    value={materialsModal.materialsText}
                                    onChange={(e) => setMaterialsModal({ ...materialsModal, materialsText: e.target.value })}
                                    placeholder="I dettagli principali estratti appariranno qui (es. Numero Ordine, Cliente, Data, Cantiere)"
                                    className="w-full h-24 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Table extraction & verification */}
                        <div className="flex flex-col space-y-4 max-h-full">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Articoli / Lista Materiali
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMaterialsModal(prev => {
                                            if (!prev) return null;
                                            return {
                                                ...prev,
                                                materialsTable: [...prev.materialsTable, { codice: '', descrizione: '', quantita: '1' }]
                                            };
                                        });
                                    }}
                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                    + Aggiungi riga
                                </button>
                            </div>

                            {isExtracting && (
                                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
                                    <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Estrazione testi in corso con Gemini AI...</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Analisi layout dell'immagine ed estrazione dei codici materiale.</p>
                                    </div>
                                </div>
                            )}

                            {extractError && (
                                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs rounded-xl border border-amber-200 dark:border-amber-900 font-medium">
                                    {extractError}
                                </div>
                            )}

                            {!isExtracting && (
                                <div className="flex-grow overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                    {materialsModal.materialsTable.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500 text-center h-full">
                                            <svg className="h-10 w-10 mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                            <p className="text-sm font-medium">Nessun materiale caricato.</p>
                                            <p className="text-xs">Trascina o incolla l'immagine oppure aggiungi una riga manualmente.</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                                            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Codice</th>
                                                    <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Descrizione</th>
                                                    <th className="px-3 py-2 text-center font-semibold text-slate-500 uppercase tracking-wider w-16">Q.tà</th>
                                                    <th className="px-3 py-2 text-center font-semibold text-slate-500 uppercase tracking-wider w-10">Az.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-850">
                                                {materialsModal.materialsTable.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={row.codice}
                                                                onChange={(e) => {
                                                                    const newTable = [...materialsModal.materialsTable];
                                                                    newTable[idx].codice = e.target.value;
                                                                    setMaterialsModal({ ...materialsModal, materialsTable: newTable });
                                                                }}
                                                                placeholder="Codice"
                                                                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={row.descrizione}
                                                                onChange={(e) => {
                                                                    const newTable = [...materialsModal.materialsTable];
                                                                    newTable[idx].descrizione = e.target.value;
                                                                    setMaterialsModal({ ...materialsModal, materialsTable: newTable });
                                                                }}
                                                                placeholder="Descrizione"
                                                                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="text"
                                                                value={row.quantita}
                                                                onChange={(e) => {
                                                                    const newTable = [...materialsModal.materialsTable];
                                                                    newTable[idx].quantita = e.target.value;
                                                                    setMaterialsModal({ ...materialsModal, materialsTable: newTable });
                                                                }}
                                                                placeholder="Q.tà"
                                                                className="w-full px-1 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-center font-semibold"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newTable = materialsModal.materialsTable.filter((_, i) => i !== idx);
                                                                    setMaterialsModal({ ...materialsModal, materialsTable: newTable });
                                                                }}
                                                                className="text-red-500 hover:text-red-700 font-bold px-1"
                                                                title="Elimina"
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <button
                            type="button"
                            onClick={() => setMaterialsModal(null)}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition"
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onToggleActivity(materialsModal.projectId, materialsModal.activityId, {
                                    materialsImage: materialsModal.materialsImage,
                                    materialsText: materialsModal.materialsText,
                                    materialsTable: materialsModal.materialsTable
                                });
                                setMaterialsModal(null);
                            }}
                            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition"
                        >
                            Salva e Completa
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProjectsToDoView;
