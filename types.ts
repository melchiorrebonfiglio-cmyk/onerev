// Fix: Define and export the Todo interface as it is imported and used in `components/TodoListView.tsx`.
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export interface SubTask {
  name: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface SitoIntermedio {
  id: string;
  centrale: string;
  apparato: string;
  posizione: string;
  porta: string;
  attivita: string;
  patchOttica?: boolean;
}

export interface TechnicalData {
  ip: string;
  ipGateway?: string;
  svlanMgt: string;
  svlanPay: string;
  nomeApparato?: string;
  tipoApparato?: string;
  centraleDiAttestazioneFibra?: string;
  apparatoAttestazioneFibra?: string;
  portaApparatoAttestazioneFibra?: string;
  posizioneApparatoInCentrale?: string;
  centraleDiAttestazioneMgt?: string;
  terminazioneDelServizio?: string;
  apparatoTransportAttestazioneServizio?: string; // Renamed from apparatoAttestazioneServizio
  portaApparatoAttestazioneServizio?: string;
  apparatoIpNni?: string; // New
  idEnriCommand?: string; // New
  tipoConsegna?: string; // New
  reteConsegna?: string; // New
  posizioneApparato?: string; // New
  portaApparatoCliente?: string; // Renamed from portaRilascioSedeCliente
  lunghezzaOttica?: string;
  attenuazioneMaxDb?: string;
  posizioneCassettoFibra?: string;
  sitiIntermedi?: SitoIntermedio[];
}

export interface Activity {
  id: number;
  name: string;
  completed: boolean;
  subTask?: SubTask;
  // Fix: Add an optional 'todos' property to the Activity interface, as it is accessed in `components/TodoListView.tsx`.
  todos?: Todo[];
  originalId?: number;
  completedAt?: string | null;
  technicalData?: TechnicalData;
  idCommand?: string;
  namingServizio?: string;
  materialsImage?: string;
  materialsText?: string;
  materialsTable?: { codice: string; descrizione: string; quantita: string }[];
}

export interface RiferimentoSede {
  referente?: string;
  tel?: string;
}

export interface Sito {
  tipologiaSito: string;
  indirizzo: string;
  citta: string;
  acronimo: string;
  riferimentoCliente: string;
  telefono: string;
  email: string;
  interfaccia: string;
}

export interface Ordine {
  idOdf: string;
  idOrdine: string;
  tipo: string;
}

export interface Servizio {
  cpe: string;
  banda: string;
  noteIngaggio?: string;
}

export interface Project {
  id: string; // Using CRQ number as ID
  ragioneSociale: string;
  via: string;
  citta: string;
  riepilogo?: string;
  responsabileProgetto?: string; // New
  operazioniNecessarie?: string; // New
  note?: string; // New
  riferimentoSede: RiferimentoSede;
  activities: Activity[];
  status: 'on going' | 'pending' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  ordine?: Ordine;
  sitoA?: Sito;
  sitoZ?: Sito;
  servizio?: Servizio;
}