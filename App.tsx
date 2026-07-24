import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, RiferimentoSede, Activity, SubTask, TechnicalData, Sito, Ordine, Servizio } from './types';
import { ACTIVITIES_TEMPLATE, INITIAL_SERVICE_TERMINATION_DATA, DEFAULT_INFRASTRUCTURE_DATA } from './constants';
import Header from './components/Header';
import AddProjectForm from './components/AddProjectForm';
import ProjectCard from './components/ProjectCard';
import ProjectListView from './components/ProjectListView';
import EditProjectModal from './components/EditProjectModal';
import ProjectStats from './components/ProjectStats';
import { ListBulletIcon } from './components/icons/ListBulletIcon';
import { PlusCircleIcon } from './components/icons/PlusCircleIcon';
import ProjectFilter from './components/ProjectFilter';
import { ClipboardDocumentCheckIcon } from './components/icons/ClipboardDocumentCheckIcon';
import ProjectsToDoView from './components/ProjectsToDoView';
import ProjectListFilters, { FilterType } from './components/ProjectListFilters';
import { ArchiveBoxIcon } from './components/icons/ArchiveBoxIcon';
import InfrastructureManagementModal from './components/InfrastructureManagementModal';
import ServiceTerminationManagementModal from './components/ServiceTerminationManagementModal';
import { Cog6ToothIcon } from './components/icons/Cog6ToothIcon';

const createActivitiesWithSubTasks = (existingActivities?: Partial<Activity>[], initialTechnicalData?: TechnicalData): Activity[] => {
  const baseTechnicalData: TechnicalData = {
      ip: '', 
      ipGateway: '', 
      svlanMgt: '', 
      svlanPay: '', 
      nomeApparato: '', 
      tipoApparato: '', 
      centraleDiAttestazioneFibra: '',
      apparatoAttestazioneFibra: '',
      portaApparatoAttestazioneFibra: '',
      posizioneApparatoInCentrale: '',
      centraleDiAttestazioneMgt: '',
      terminazioneDelServizio: '',
      tipoConsegna: '',
      reteConsegna: '',
      apparatoTransportAttestazioneServizio: '',
      portaApparatoAttestazioneServizio: '',
      portaApparatoCliente: 'P01',
      apparatoIpNni: '',
      idEnriCommand: '',
      lunghezzaOttica: '',
      attenuazioneMaxDb: '',
      posizioneCassettoFibra: '',
      posizioneApparato: ''
  };

  if (!existingActivities) {
    return ACTIVITIES_TEMPLATE.map(template => {
      let technicalData: TechnicalData | undefined = undefined;

      switch (template.id) {
        case 1: // Configurazione IP di MGT
          technicalData = initialTechnicalData ? { ...baseTechnicalData, ...initialTechnicalData } : baseTechnicalData;
          break;
      }
      return {
        ...template,
        completed: false,
        technicalData,
      };
    });
  }

  const templateMap = new Map(ACTIVITIES_TEMPLATE.map(t => [t.id, t]));

  // Deduplicate existing activities to ensure "Progetto Chiuso" appears only once per project
  let seenProgettoChiuso = false;
  const deduplicatedExisting = existingActivities.filter(activity => {
    const nameLower = (activity.name || '').trim().toLowerCase();
    const baseId = activity.originalId ?? activity.id;
    if (baseId === 4 || nameLower === 'progetto chiuso') {
      if (seenProgettoChiuso) {
        return false;
      }
      seenProgettoChiuso = true;
    }
    return true;
  });

  const mappedActivities = deduplicatedExisting.map(activity => {
    const template = activity.id !== undefined ? templateMap.get(activity.id) : undefined;

    let technicalData = activity.technicalData;
    
    if (!technicalData && (activity.id === 1 || activity.originalId === 1)) {
        technicalData = baseTechnicalData;
    } else if (technicalData) {
        const updates: Partial<TechnicalData> = {};
        if (typeof technicalData.nomeApparato === 'undefined') updates.nomeApparato = '';
        if (typeof technicalData.centraleDiAttestazioneFibra === 'undefined') {
            // @ts-ignore
            updates.centraleDiAttestazioneFibra = technicalData.centraleDiAttestazione || ''; 
        }
        if (typeof technicalData.centraleDiAttestazioneMgt === 'undefined') updates.centraleDiAttestazioneMgt = '';
        if (typeof technicalData.ipGateway === 'undefined') updates.ipGateway = '';
        if (typeof technicalData.terminazioneDelServizio === 'undefined') updates.terminazioneDelServizio = '';
        if (typeof technicalData.apparatoAttestazioneFibra === 'undefined') updates.apparatoAttestazioneFibra = '';
        if (typeof technicalData.portaApparatoAttestazioneFibra === 'undefined') updates.portaApparatoAttestazioneFibra = '';
        if (typeof technicalData.posizioneApparatoInCentrale === 'undefined') updates.posizioneApparatoInCentrale = '';

        // Migration from old fields
        if (typeof technicalData.apparatoTransportAttestazioneServizio === 'undefined') {
          // @ts-ignore
          updates.apparatoTransportAttestazioneServizio = technicalData.apparatoAttestazioneServizio || '';
        }
         if (typeof technicalData.portaApparatoCliente === 'undefined') {
          // @ts-ignore
          updates.portaApparatoCliente = technicalData.portaRilascioSedeCliente || '';
        }
        
        // Init new fields
        if (typeof technicalData.tipoApparato === 'undefined') updates.tipoApparato = '';
        if (typeof technicalData.apparatoIpNni === 'undefined') updates.apparatoIpNni = '';
        if (typeof technicalData.idEnriCommand === 'undefined') updates.idEnriCommand = '';
        if (typeof technicalData.tipoConsegna === 'undefined') updates.tipoConsegna = '';
        if (typeof technicalData.reteConsegna === 'undefined') updates.reteConsegna = '';
        if (typeof technicalData.lunghezzaOttica === 'undefined') updates.lunghezzaOttica = '';
        if (typeof technicalData.attenuazioneMaxDb === 'undefined') updates.attenuazioneMaxDb = '';
        if (typeof technicalData.posizioneCassettoFibra === 'undefined') updates.posizioneCassettoFibra = '';
        if (typeof technicalData.posizioneApparato === 'undefined') updates.posizioneApparato = '';

        // Keep old renamed fields from being passed through, while applying updates
        // @ts-ignore
        const { apparatoAttestazioneServizio, portaRilascioSedeCliente, ...rest } = technicalData;

        if (Object.keys(updates).length > 0) {
            technicalData = { ...rest, ...updates };
            // @ts-ignore
            delete technicalData.centraleDiAttestazione;
        }
    }

    if (template) {
      return {
        ...template,
        ...activity,
        name: template.name, 
        technicalData,
      };
    }
    
    return {
        ...activity,
        technicalData
    };
  }) as Activity[];

  const templateOrder = ACTIVITIES_TEMPLATE.map(t => t.id);
  const existingTemplateIds = new Set(
    mappedActivities.map(a => a.originalId ?? a.id).filter(id => templateOrder.includes(id))
  );

  const missingTemplates = ACTIVITIES_TEMPLATE.filter(t => !existingTemplateIds.has(t.id));

  let finalActivities = [...mappedActivities];
  for (const missing of missingTemplates) {
    const newAct: Activity = {
      ...missing,
      completed: false,
    };

    const missingOrderIndex = templateOrder.indexOf(missing.id);
    let insertIndex = -1;

    for (let i = finalActivities.length - 1; i >= 0; i--) {
      const actId = finalActivities[i].originalId ?? finalActivities[i].id;
      const orderIdx = templateOrder.indexOf(actId);
      if (orderIdx !== -1 && orderIdx < missingOrderIndex) {
        insertIndex = i + 1;
        break;
      }
    }

    if (insertIndex === -1) {
      for (let i = 0; i < finalActivities.length; i++) {
        const actId = finalActivities[i].originalId ?? finalActivities[i].id;
        const orderIdx = templateOrder.indexOf(actId);
        if (orderIdx !== -1 && orderIdx > missingOrderIndex) {
          insertIndex = i;
          break;
        }
      }
    }

    if (insertIndex === -1) {
      const chiusoIdx = finalActivities.findIndex(a => (a.originalId ?? a.id) === 4);
      if (chiusoIdx !== -1) {
        insertIndex = chiusoIdx;
      } else {
        insertIndex = finalActivities.length;
      }
    }

    finalActivities.splice(insertIndex, 0, newAct);
  }

  return finalActivities;
};


const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'loading' | 'setup' | 'login' | 'app'>('loading');
  const [password, setPassword] = useState(''); 
  const [newPassword, setNewPassword] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [loginError, setLoginError] = useState('');
  const [setupError, setSetupError] = useState('');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [infrastructureData, setInfrastructureData] = useState<Record<string, Record<string, string[]>>>({});
  const [serviceTerminationData, setServiceTerminationData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInfraModalOpen, setIsInfraModalOpen] = useState(false);
  const [isServiceTerminationModalOpen, setIsServiceTerminationModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'add' | 'list' | 'detail' | 'todo' | 'archived'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [listFilter, setListFilter] = useState<FilterType>('all');
  
  // Check for password and load projects from localStorage on initial render
  useEffect(() => {
    try {
        const storedPassword = localStorage.getItem('app_password');
        if (storedPassword) {
            setAppMode('login');
        } else {
            setAppMode('setup');
        }

        const storedProjects = localStorage.getItem('projects');
        let migratedProjects: Project[] = [];
        if (storedProjects) {
            const parsedProjects: Project[] = JSON.parse(storedProjects);
            migratedProjects = parsedProjects.map(p => ({
                ...p,
                activities: createActivitiesWithSubTasks(p.activities)
            }));
            setProjects(migratedProjects);
        }

        // Populate dynamic infrastructure data from existing projects combined with DEFAULT_INFRASTRUCTURE_DATA
        const initialData: Record<string, Record<string, string[]>> = { ...DEFAULT_INFRASTRUCTURE_DATA };

        migratedProjects.forEach(p => {
            p.activities.forEach(act => {
                const td = act.technicalData;
                if (td?.centraleDiAttestazioneFibra) {
                    if (!initialData[td.centraleDiAttestazioneFibra]) {
                        initialData[td.centraleDiAttestazioneFibra] = {};
                    }
                    if (td.apparatoAttestazioneFibra) {
                        if (!initialData[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra]) {
                            initialData[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra] = [];
                        }
                        if (td.posizioneApparatoInCentrale && !initialData[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra].includes(td.posizioneApparatoInCentrale)) {
                            initialData[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra].push(td.posizioneApparatoInCentrale);
                        }
                    }
                }
            });
        });

        const storedInfra = localStorage.getItem('infrastructureData');
        if (storedInfra && Object.keys(JSON.parse(storedInfra)).length > 0) {
            const parsed = JSON.parse(storedInfra);
            const merged = { ...initialData, ...parsed };
            // Merge inner objects for existing keys
            Object.keys(initialData).forEach(key => {
                if (parsed[key]) {
                    const mergedApparatus = { ...initialData[key], ...parsed[key] };
                    Object.keys(mergedApparatus).forEach(app => {
                        const mergedPositions = Array.from(new Set([
                            ...(initialData[key][app] || []),
                            ...(parsed[key][app] || [])
                        ]));
                        mergedApparatus[app] = mergedPositions;
                    });
                    merged[key] = mergedApparatus;
                }
            });
            setInfrastructureData(merged);
            localStorage.setItem('infrastructureData', JSON.stringify(merged));
        } else {
            setInfrastructureData(initialData);
            localStorage.setItem('infrastructureData', JSON.stringify(initialData));
        }

        // Load service termination data - use initial static data and clear existing if requested
        // We use a specific key to track if we've already performed the "pulisci" reset
        const serviceDataResetMark = localStorage.getItem('serviceTerminationData_reset_v2');
        if (!serviceDataResetMark) {
            setServiceTerminationData(INITIAL_SERVICE_TERMINATION_DATA);
            localStorage.setItem('serviceTerminationData', JSON.stringify(INITIAL_SERVICE_TERMINATION_DATA));
            localStorage.setItem('serviceTerminationData_reset_v2', 'true');
        } else {
            const storedServiceData = localStorage.getItem('serviceTerminationData');
            if (storedServiceData) {
                setServiceTerminationData(JSON.parse(storedServiceData));
            } else {
                setServiceTerminationData(INITIAL_SERVICE_TERMINATION_DATA);
            }
        }
    } catch (error) {
        console.error("Failed to initialize from localStorage", error);
        setProjects([]);
        // Decide on error mode if needed
    } finally {
        setIsLoading(false); // Done loading initial data
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) { // Only save after initial load is complete
        try {
            localStorage.setItem('projects', JSON.stringify(projects));
            localStorage.setItem('infrastructureData', JSON.stringify(infrastructureData));
            localStorage.setItem('serviceTerminationData', JSON.stringify(serviceTerminationData));
        } catch (error) {
            console.error("Failed to save projects to localStorage", error);
        }
    }
  }, [projects, infrastructureData, serviceTerminationData, isLoading]);
  
  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (!newPassword || !confirmPassword) {
        setSetupError('Entrambi i campi sono obbligatori.');
        return;
    }
    if (newPassword !== confirmPassword) {
        setSetupError('Le password non coincidono. Riprova.');
        return;
    }
    try {
        localStorage.setItem('app_password', newPassword);
        setAppMode('app');
    } catch (error) {
        console.error("Failed to save password to localStorage", error);
        setSetupError('Impossibile salvare la password. Controlla le impostazioni del browser.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
        const storedPassword = localStorage.getItem('app_password');
        if (password === storedPassword) {
            setAppMode('app');
        } else {
            setLoginError('Password non corretta. Riprova.');
            setPassword('');
        }
    } catch (error) {
        console.error("Could not access localStorage", error);
        setLoginError('Impossibile verificare la password. Controlla le impostazioni del browser.');
    }
  };
  
  const findProjectAndUpdate = (projectId: string, updateFn: (project: Project) => Project) => {
    setProjects(prevProjects => prevProjects.map(p =>
      p.id === projectId ? { ...updateFn(p), updatedAt: new Date().toISOString() } : p
    ));
  };
  
  const addProject = (
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
) => {
    if (projects.some(p => p.id.toLowerCase() === crq.toLowerCase())) {
        alert(`Un progetto con CRQ / ID ORDINE "${crq}" esiste già.`);
        return;
    }

    const newProject: Project = {
      id: crq,
      ragioneSociale,
      via,
      citta,
      riepilogo,
      responsabileProgetto,
      operazioniNecessarie,
      note,
      riferimentoSede,
      activities: createActivitiesWithSubTasks(undefined, undefined),
      status: 'on going',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ordine,
      sitoA,
      sitoZ,
      servizio,
    };

    // Update dynamic infrastructure data from initial data if provided
    const newInfra = { ...infrastructureData };
    let changed = false;

    newProject.activities.forEach(act => {
        const td = act.technicalData;
        if (td?.centraleDiAttestazioneFibra) {
            if (!newInfra[td.centraleDiAttestazioneFibra]) {
                newInfra[td.centraleDiAttestazioneFibra] = {};
                changed = true;
            }
            if (td.apparatoAttestazioneFibra) {
                if (!newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra]) {
                    newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra] = [];
                    changed = true;
                }
                if (td.posizioneApparatoInCentrale && !newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra].includes(td.posizioneApparatoInCentrale)) {
                    newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra].push(td.posizioneApparatoInCentrale);
                    changed = true;
                }
            }
        }
    });

    if (changed) {
        setInfrastructureData(newInfra);
    }

    setProjects(prevProjects => [newProject, ...prevProjects]);
    setConfirmationMessage(`Progetto "${crq}" aggiunto con successo!`);
    setCurrentView('list');
    setTimeout(() => setConfirmationMessage(null), 3000);
  };
  
  const changeProjectStatus = (projectId: string, newStatus: Project['status']) => {
    findProjectAndUpdate(projectId, project => {
        if (project.status === newStatus) return project;
        const isNowInactive = newStatus === 'closed' || newStatus === 'pending' || newStatus === 'archived';
        const wasInactive = project.status === 'closed' || project.status === 'pending' || project.status === 'archived';
        return { 
            ...project, 
            status: newStatus,
            completedAt: (isNowInactive && !wasInactive) ? new Date().toISOString() : (isNowInactive ? project.completedAt : null)
        };
    });
  };
  
  const updateProject = (originalProjectId: string, updatedProjectData: Project) => {
    // Update dynamic infrastructure data
    const newInfra = { ...infrastructureData };
    let changed = false;

    updatedProjectData.activities.forEach(act => {
        const td = act.technicalData;
        if (td?.centraleDiAttestazioneFibra) {
            if (!newInfra[td.centraleDiAttestazioneFibra]) {
                newInfra[td.centraleDiAttestazioneFibra] = {};
                changed = true;
            }
            if (td.apparatoAttestazioneFibra) {
                if (!newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra]) {
                    newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra] = [];
                    changed = true;
                }
                if (td.posizioneApparatoInCentrale && !newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra].includes(td.posizioneApparatoInCentrale)) {
                    newInfra[td.centraleDiAttestazioneFibra][td.apparatoAttestazioneFibra].push(td.posizioneApparatoInCentrale);
                    changed = true;
                }
            }
        }
    });

    if (changed) {
        setInfrastructureData(newInfra);
    }

    let allCompleted = true;
    updatedProjectData.activities.forEach(act => {
        if (!act.completed) {
            allCompleted = false;
        }
        if (act.subTask && !act.subTask.completed) {
            allCompleted = false;
        }
    });

    const newStatus: Project['status'] = allCompleted
        ? 'archived'
        : (updatedProjectData.status === 'closed' || updatedProjectData.status === 'archived' ? 'on going' : updatedProjectData.status);

    const finalProjectData = { 
      ...updatedProjectData, 
      status: newStatus,
      completedAt: allCompleted ? (updatedProjectData.completedAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString() 
    };

    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === originalProjectId
          ? finalProjectData
          : p
      )
    );
    setEditingProject(null);
    setConfirmationMessage(`Progetto "${finalProjectData.id}" aggiornato.`);
    setTimeout(() => setConfirmationMessage(null), 3000);
  };

  const addCentral = (name: string) => {
    if (!name || infrastructureData[name]) return;
    setInfrastructureData(prev => ({
      ...prev,
      [name]: {}
    }));
    setConfirmationMessage(`Nuova centrale "${name}" aggiunta.`);
    setTimeout(() => setConfirmationMessage(null), 3000);
  };

  const renameServiceTerminationCentral = (oldName: string, newName: string) => {
    setServiceTerminationData(prev => {
        const newData = { ...prev };
        const centralData = newData[oldName];
        delete newData[oldName];
        newData[newName] = centralData;
        return newData;
    });

    setProjects(prev => prev.map(p => ({
        ...p,
        activities: p.activities.map(act => {
            if (act.technicalData?.terminazioneDelServizio === oldName) {
                return {
                    ...act,
                    technicalData: {
                        ...act.technicalData,
                        terminazioneDelServizio: newName
                    }
                };
            }
            return act;
        })
    })));
    setConfirmationMessage(`Centrale terminazione "${oldName}" rinominata in "${newName}".`);
    setTimeout(() => setConfirmationMessage(null), 3000);
  };

  const deleteServiceTerminationCentral = (name: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la centrale terminazione "${name}"?`)) {
        setServiceTerminationData(prev => {
            const newData = { ...prev };
            delete newData[name];
            return newData;
        });
        setConfirmationMessage(`Centrale terminazione "${name}" eliminata.`);
        setTimeout(() => setConfirmationMessage(null), 3000);
    }
  };

  const addServiceTerminationCentral = (name: string) => {
    if (!serviceTerminationData[name]) {
        setServiceTerminationData(prev => ({
            ...prev,
            [name]: {}
        }));
        setConfirmationMessage(`Centrale terminazione "${name}" aggiunta con successo.`);
        setTimeout(() => setConfirmationMessage(null), 3000);
    }
  };

  const updateServiceTerminationData = (centralName: string, apparatusData: any) => {
    setServiceTerminationData((prev: any) => ({
        ...prev,
        [centralName]: apparatusData
    }));
  };

  const renameCentral = (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName) return;

    // 1. Update infrastructureData
    const newInfra = { ...infrastructureData };
    const sourceInfra = newInfra[oldName];
    
    if (sourceInfra) {
      if (newInfra[newName]) {
        // Target already exists, merge them
        const targetInfra = newInfra[newName];
        Object.keys(sourceInfra).forEach(apparato => {
          if (!targetInfra[apparato]) {
            targetInfra[apparato] = [];
          }
          sourceInfra[apparato].forEach(pos => {
            if (!targetInfra[apparato].includes(pos)) {
              targetInfra[apparato].push(pos);
            }
          });
        });
      } else {
        // Target doesn't exist, just rename the key
        newInfra[newName] = sourceInfra;
      }
      delete newInfra[oldName];
      setInfrastructureData(newInfra);
    }

    // 2. Update all projects
    setProjects(prevProjects => prevProjects.map(project => {
      let projectChanged = false;
      const updatedActivities = project.activities.map(activity => {
        if (activity.technicalData?.centraleDiAttestazioneFibra === oldName) {
          projectChanged = true;
          return {
            ...activity,
            technicalData: {
              ...activity.technicalData,
              centraleDiAttestazioneFibra: newName
            }
          };
        }
        return activity;
      });

      if (projectChanged) {
        return {
          ...project,
          activities: updatedActivities,
          updatedAt: new Date().toISOString()
        };
      }
      return project;
    }));

    setConfirmationMessage(`Centrale rinominata da "${oldName}" a "${newName}"`);
    setTimeout(() => setConfirmationMessage(null), 3000);
  };

  const deleteCentral = (name: string) => {
    if (!name) return;
    
    // 1. Update infrastructureData
    const newInfra = { ...infrastructureData };
    if (newInfra[name]) {
      delete newInfra[name];
      setInfrastructureData(newInfra);
    }

    // 2. Update all projects (clear the field if it matches)
    setProjects(prevProjects => prevProjects.map(project => {
      let projectChanged = false;
      const updatedActivities = project.activities.map(activity => {
        if (activity.technicalData?.centraleDiAttestazioneFibra === name) {
          projectChanged = true;
          return {
            ...activity,
            technicalData: {
              ...activity.technicalData,
              centraleDiAttestazioneFibra: ''
            }
          };
        }
        return activity;
      });

      if (projectChanged) {
        return {
          ...project,
          activities: updatedActivities,
          updatedAt: new Date().toISOString()
        };
      }
      return project;
    }));

    setConfirmationMessage(`Centrale "${name}" eliminata dalla lista.`);
    setTimeout(() => setConfirmationMessage(null), 3000);
  };
  
  const updateCentralInfrastructure = (centralName: string, data: Record<string, string[]>) => {
    setInfrastructureData(prev => ({
      ...prev,
      [centralName]: data
    }));
  };

  const resetInfrastructureToDefault = () => {
    if (window.confirm("Sei sicuro di voler ripristinare le centrali di default? Questa operazione sovrascriverà le modifiche correnti.")) {
      setInfrastructureData(DEFAULT_INFRASTRUCTURE_DATA);
      localStorage.setItem('infrastructureData', JSON.stringify(DEFAULT_INFRASTRUCTURE_DATA));
      setConfirmationMessage("Centrali di default ripristinate con successo.");
      setTimeout(() => setConfirmationMessage(null), 3000);
    }
  };

  const deleteProject = (projectId: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il progetto "${projectId}"? L'azione è irreversibile.`)) {
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      setConfirmationMessage(`Progetto "${projectId}" eliminato.`);
      if (selectedProjectId === projectId) {
          setSelectedProjectId(null);
          setCurrentView('list');
      }
      setTimeout(() => setConfirmationMessage(null), 3000);
    }
  };

  const toggleActivity = (
    projectId: string, 
    activityId: number, 
    extraData?: { 
      idCommand?: string; 
      namingServizio?: string;
      materialsImage?: string;
      materialsText?: string;
      materialsTable?: { codice: string; descrizione: string; quantita: string }[];
    }
  ) => {
    findProjectAndUpdate(projectId, project => {
      const newActivities = project.activities.map(act => {
        if (act.id === activityId) {
          const isNowCompleted = !act.completed;
          const updatedActivity = { 
              ...act, 
              completed: isNowCompleted,
              completedAt: isNowCompleted ? new Date().toISOString() : null,
              ...(extraData ? extraData : {})
          };
          if (updatedActivity.subTask) {
            updatedActivity.subTask.completed = isNowCompleted;
            updatedActivity.subTask.completedAt = isNowCompleted ? new Date().toISOString() : null;
          }
          return updatedActivity;
        }
        return act;
      });
  
      const chiusoActivity = newActivities.find(act => (act.originalId ?? act.id) === 4 || act.name.toLowerCase() === 'progetto chiuso');
      const isChiuso = chiusoActivity ? chiusoActivity.completed : false;
      const newStatus = isChiuso ? 'archived' : 'on going';
  
      return { ...project, activities: newActivities, status: newStatus, completedAt: isChiuso ? new Date().toISOString() : null };
    });
  };
  
  const toggleSubTask = (projectId: string, activityId: number) => {
    findProjectAndUpdate(projectId, project => {
      const newActivities = project.activities.map(act => {
        if (act.id === activityId && act.subTask) {
          const isSubtaskNowCompleted = !act.subTask.completed;
          const newSubTask = { 
              ...act.subTask, 
              completed: isSubtaskNowCompleted,
              completedAt: isSubtaskNowCompleted ? new Date().toISOString() : null 
          };
          const isParentCompleted = isSubtaskNowCompleted;
          return { 
              ...act, 
              subTask: newSubTask,
              completed: isParentCompleted,
              completedAt: isParentCompleted ? (act.completedAt || new Date().toISOString()) : null
          };
        }
        return act;
      });
  
      const chiusoActivity = newActivities.find(act => (act.originalId ?? act.id) === 4 || act.name.toLowerCase() === 'progetto chiuso');
      const isChiuso = chiusoActivity ? chiusoActivity.completed : false;
      const newStatus = isChiuso ? 'archived' : 'on going';
      
      return { ...project, activities: newActivities, status: newStatus, completedAt: isChiuso ? new Date().toISOString() : null };
    });
  };
  
  const duplicateActivity = (projectId: string, activityId: number) => {
      findProjectAndUpdate(projectId, project => {
          const activityToDuplicate = project.activities.find(a => a.id === activityId);
          if (!activityToDuplicate) return project;
          
          const newActivity: Activity = {
              ...JSON.parse(JSON.stringify(activityToDuplicate)),
              id: Date.now(),
              originalId: activityToDuplicate.originalId ?? activityToDuplicate.id,
              name: `${activityToDuplicate.name} (bis)`,
              completed: false,
              completedAt: null,
          };

          if (newActivity.subTask) {
            newActivity.subTask.completed = false;
            newActivity.subTask.completedAt = null;
          }

          if (newActivity.technicalData) {
             newActivity.technicalData = {
                ip: '', 
                ipGateway: '', 
                svlanMgt: '', 
                svlanPay: '', 
                nomeApparato: '', 
                tipoApparato: '', 
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
                idEnriCommand: '',
                tipoConsegna: '',
                reteConsegna: '',
                posizioneApparato: '',
             }
          }
  
          const index = project.activities.findIndex(a => a.id === activityId);
          const newActivities = [...project.activities];
          newActivities.splice(index + 1, 0, newActivity);
  
          return { ...project, activities: newActivities };
      });
  };
  
  const handleExportJSON = () => {
    if (projects.length === 0) {
      alert("Nessun progetto da esportare.");
      return;
    }
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(projects, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const date = new Date().toISOString().slice(0, 10);
      link.download = `projects-backup-${date}.json`;
      link.click();
      setConfirmationMessage("Esportazione completata!");
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch (error) {
      console.error("Failed to export projects", error);
      alert("Errore durante l'esportazione dei progetti.");
    }
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read");
        const importedProjects: Project[] = JSON.parse(text);
        
        if (!Array.isArray(importedProjects) || (importedProjects.length > 0 && !importedProjects[0].id)) {
          throw new Error("Invalid project file format.");
        }

        const migratedProjects = importedProjects.map(p => ({
          ...p,
          activities: createActivitiesWithSubTasks(p.activities)
        }));

        setProjects(migratedProjects);
        setConfirmationMessage("Importazione completata con successo!");
        setCurrentView('list');
      } catch (error) {
        console.error("Failed to import projects", error);
        alert(`Errore durante l'importazione: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setTimeout(() => setConfirmationMessage(null), 3000);
      }
    };
    reader.onerror = () => {
        alert("Errore nella lettura del file.");
    };
    reader.readAsText(file);
  };
  
  const onGoingProjects = useMemo(() => projects.filter(p => p.status === 'on going'), [projects]);
  const archivedProjects = useMemo(() => projects.filter(p => p.status === 'archived'), [projects]);

  const stats = useMemo(() => ({
    onGoing: projects.filter(p => p.status === 'on going').length,
    pending: projects.filter(p => p.status === 'pending').length,
    closed: projects.filter(p => p.status === 'closed').length,
    archived: projects.filter(p => p.status === 'archived').length,
  }), [projects]);

  const filterCounts = useMemo(() => {
    return projects.reduce((acc, project) => {
        if (project.status === 'on going') {
            const mgtActivity = project.activities.find(a => (a.originalId ?? a.id) === 1);
            const docServActivity = project.activities.find(a => (a.originalId ?? a.id) === 3);
            const chiusoActivity = project.activities.find(a => (a.originalId ?? a.id) === 4);

            const mgtCompleted = mgtActivity?.completed ?? false;
            const docServCompleted = docServActivity?.completed ?? false;

            if (!mgtCompleted) {
                acc.no_mgt++;
            }
            if (!docServCompleted) {
                acc.no_doc++;
            }
            if (mgtCompleted && docServCompleted && !(chiusoActivity?.completed)) {
                acc.ready_for_close++;
            }
        }
        return acc;
    }, { no_mgt: 0, no_doc: 0, ready_for_close: 0 });
  }, [projects]);
  
  const filteredProjects = useMemo(() => {
    const activeProjects = projects.filter(p => p.status !== 'archived');
    
    let filtered = activeProjects;

    if (activeFilter) {
      const lowercasedFilter = activeFilter.toLowerCase();
      filtered = filtered.filter(project =>
        project.ragioneSociale.toLowerCase().includes(lowercasedFilter) ||
        project.id.toLowerCase().includes(lowercasedFilter)
      );
    }

    switch (listFilter) {
      case 'no_mgt':
        return filtered.filter(p => {
            const mgt = p.activities.find(a => (a.originalId ?? a.id) === 1);
            return p.status === 'on going' && !mgt?.completed;
        });
      case 'no_doc':
        return filtered.filter(p => {
            const docServ = p.activities.find(a => (a.originalId ?? a.id) === 3);
            return p.status === 'on going' && !docServ?.completed;
        });
      case 'ready_for_close':
          return filtered.filter(p => {
              const mgt = p.activities.find(a => (a.originalId ?? a.id) === 1);
              const docServ = p.activities.find(a => (a.originalId ?? a.id) === 3);
              const chiuso = p.activities.find(a => (a.originalId ?? a.id) === 4);
              return p.status === 'on going' && mgt?.completed && docServ?.completed && !chiuso?.completed;
          });
      case 'all':
      default:
        return filtered;
    }
  }, [projects, activeFilter, listFilter]);


  const handleSearch = () => {
    setActiveFilter(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveFilter('');
  };

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('detail');
  }, []);
    
  if (appMode === 'loading' || isLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900"><p className="text-white">Loading Application...</p></div>;
  }

  if (appMode === 'setup') {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
            <form onSubmit={handleSetPassword} className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Crea una Password</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Questa password verrà usata per accedere all'applicazione.</p>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nuova Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Conferma Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" />
                </div>
                {setupError && <p className="text-red-500 text-sm mb-4">{setupError}</p>}
                <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Imposta Password</button>
            </form>
        </div>
    );
  }
  
  if (appMode === 'login') {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
            <form onSubmit={handleLogin} className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Login</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" />
                </div>
                {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
                <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Accedi</button>
            </form>
        </div>
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 font-sans">
      <Header onExportJSON={handleExportJSON} onImportJSON={handleImportJSON} />
      
      <main className="container mx-auto p-4 md:px-8 py-6">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button 
                onClick={() => { setCurrentView('add'); setSelectedProjectId(null); }} 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-orange-500 text-white hover:bg-orange-600 ${currentView === 'add' ? 'ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-slate-900 opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <PlusCircleIcon className="h-5 w-5" /> Aggiungi Progetto
            </button>
            <button 
                onClick={() => { setCurrentView('list'); setSelectedProjectId(null); }} 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-green-600 text-white hover:bg-green-700 ${currentView === 'list' ? 'ring-2 ring-offset-2 ring-green-600 dark:ring-offset-slate-900 opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <ListBulletIcon className="h-5 w-5" /> Lista Progetti
            </button>
            <button 
                onClick={() => { setCurrentView('todo'); setSelectedProjectId(null); }} 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-yellow-600 text-white hover:bg-yellow-700 ${currentView === 'todo' ? 'ring-2 ring-offset-2 ring-yellow-600 dark:ring-offset-slate-900 opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <ClipboardDocumentCheckIcon className="h-5 w-5" /> Vista TO-DO
            </button>
             <button 
                onClick={() => { setCurrentView('archived'); setSelectedProjectId(null); }} 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-amber-800 text-white hover:bg-amber-900 ${currentView === 'archived' ? 'ring-2 ring-offset-2 ring-amber-800 dark:ring-offset-slate-900 opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <ArchiveBoxIcon className="h-5 w-5" /> Progetti Archiviati
            </button>
            <button 
                onClick={() => setIsInfraModalOpen(true)} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-indigo-600 text-white hover:bg-indigo-700 opacity-70 hover:opacity-100"
            >
              <Cog6ToothIcon className="h-5 w-5" /> Gestione Centrali
            </button>
            <button 
                onClick={() => setIsServiceTerminationModalOpen(true)} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-violet-600 text-white hover:bg-violet-700 opacity-70 hover:opacity-100"
            >
              <Cog6ToothIcon className="h-5 w-5" /> Gestione Terminazione Servizio
            </button>
          </div>
        </nav>

        {currentView === 'add' && <AddProjectForm onAddProject={addProject} />}

        {(currentView === 'list' || currentView === 'todo' || currentView === 'archived') && (
            <>
                <ProjectStats onGoing={stats.onGoing} pending={stats.pending} closed={stats.closed} archived={stats.archived} />
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <ProjectFilter value={searchTerm} onChange={setSearchTerm} onSearch={handleSearch} onClear={handleClearSearch} isFilterActive={!!activeFilter} />
                    {currentView === 'list' && <ProjectListFilters activeFilter={listFilter} onChangeFilter={setListFilter} filterCounts={filterCounts} />}
                </div>
            </>
        )}
        
        {currentView === 'list' && <ProjectListView projects={filteredProjects} onToggleActivity={toggleActivity} onDuplicateActivity={duplicateActivity} onChangeProjectStatus={changeProjectStatus} onOpenEditModal={setEditingProject} onSelectProject={handleSelectProject} onDeleteProject={deleteProject} />}
        {currentView === 'todo' && (
          <ProjectsToDoView 
            projects={onGoingProjects} 
            filterTerm={activeFilter} 
            onSelectProject={handleSelectProject} 
            onToggleActivity={toggleActivity}
            onToggleSubTask={toggleSubTask}
          />
        )}
        {currentView === 'archived' && <ProjectListView projects={archivedProjects} onToggleActivity={toggleActivity} onDuplicateActivity={duplicateActivity} onChangeProjectStatus={changeProjectStatus} onOpenEditModal={setEditingProject} onSelectProject={handleSelectProject} onDeleteProject={deleteProject} />}

        {currentView === 'detail' && selectedProject && (
          <div>
            <ProjectCard 
              project={selectedProject} 
              onToggleActivity={toggleActivity} 
              onToggleSubTask={toggleSubTask} 
              onDuplicateActivity={duplicateActivity} 
              onOpenEditModal={setEditingProject} 
              onDeleteProject={deleteProject} 
              onUpdateProject={updateProject}
            />
          </div>
        )}

        {editingProject && (
          <EditProjectModal 
            project={editingProject} 
            onUpdateProject={updateProject} 
            onClose={() => setEditingProject(null)} 
            infrastructureData={infrastructureData}
            serviceTerminationData={serviceTerminationData}
          />
        )}

        {isInfraModalOpen && (
          <InfrastructureManagementModal 
            infrastructureData={infrastructureData}
            onRenameCentral={renameCentral}
            onDeleteCentral={deleteCentral}
            onAddCentral={addCentral}
            onUpdateInfrastructure={updateCentralInfrastructure}
            onResetToDefault={resetInfrastructureToDefault}
            onClose={() => setIsInfraModalOpen(false)}
          />
        )}

        {isServiceTerminationModalOpen && (
          <ServiceTerminationManagementModal 
            data={serviceTerminationData}
            onRenameCentral={renameServiceTerminationCentral}
            onDeleteCentral={deleteServiceTerminationCentral}
            onAddCentral={addServiceTerminationCentral}
            onUpdateData={updateServiceTerminationData}
            onClose={() => setIsServiceTerminationModalOpen(false)}
          />
        )}

        {confirmationMessage && <div className="fixed bottom-4 right-4 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg animate-pulse">{confirmationMessage}</div>}

      </main>
    </div>
  );
};

export default App;