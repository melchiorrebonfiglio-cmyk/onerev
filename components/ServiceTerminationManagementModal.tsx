
import React, { useState, useMemo } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

interface ServiceTerminationManagementModalProps {
  data: any;
  onRenameCentral: (oldName: string, newName: string) => void;
  onDeleteCentral: (name: string) => void;
  onAddCentral: (name: string) => void;
  onUpdateData: (centralName: string, apparatusData: any) => void;
  onClose: () => void;
}

const ServiceTerminationManagementModal: React.FC<ServiceTerminationManagementModalProps> = ({ 
  data, 
  onRenameCentral, 
  onDeleteCentral,
  onAddCentral,
  onUpdateData,
  onClose 
}) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [replacingName, setReplacingName] = useState<string | null>(null);
  const [expandedCentral, setExpandedCentral] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [newCentralName, setNewCentralName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newTipoName, setNewTipoName] = useState('');
  const [newReteName, setNewReteName] = useState('');

  const centrals = useMemo(() => {
    const list = Object.keys(data || {}).sort();
    if (!searchTerm) return list;
    return list.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  const handleStartEdit = (name: string) => {
    setEditingName(name);
    setNewName(name);
    setReplacingName(null);
  };

  const handleSaveEdit = () => {
    if (editingName && newName && editingName !== newName) {
      onRenameCentral(editingName, newName);
    }
    setEditingName(null);
  };

  const handleStartReplace = (name: string) => {
    setReplacingName(name);
    setEditingName(null);
  };

  const handleConfirmReplace = (targetName: string) => {
    if (replacingName && targetName) {
      onRenameCentral(replacingName, targetName);
    }
    setReplacingName(null);
  };

  const handleAddTipo = (centralName: string) => {
    if (!newTipoName) return;
    const currentData = { ...data[centralName] };
    if (!currentData[newTipoName]) {
      currentData[newTipoName] = {};
      onUpdateData(centralName, currentData);
    }
    setNewTipoName('');
  };

  const handleRemoveTipo = (centralName: string, tipo: string) => {
    const currentData = { ...data[centralName] };
    delete currentData[tipo];
    onUpdateData(centralName, currentData);
  };

  const handleAddRete = (centralName: string, tipo: string) => {
    if (!newReteName) return;
    const currentData = { ...data[centralName] };
    if (!currentData[tipo][newReteName]) {
      currentData[tipo][newReteName] = { 
        apparatoTransport: '', 
        portaApparato: '', 
        apparatoIpNni: '', 
        idEnriCommand: '',
        posizioneApparato: ''
      };
      onUpdateData(centralName, currentData);
    }
    setNewReteName('');
  };

  const handleRemoveRete = (centralName: string, tipo: string, rete: string) => {
    const currentData = { ...data[centralName] };
    delete currentData[tipo][rete];
    onUpdateData(centralName, currentData);
  };

  const handleUpdateFields = (centralName: string, tipo: string, rete: string, field: string, value: string) => {
    const currentData = { ...data[centralName] };
    currentData[tipo][rete] = { ...currentData[tipo][rete], [field]: value };
    onUpdateData(centralName, currentData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-bottom border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestione Terminazione Servizio</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configura Centrali, Tipi di Consegna e Reti.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <XCircleIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Nome nuova centrale terminazione..."
              value={newCentralName}
              onChange={(e) => setNewCentralName(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCentralName) {
                  onAddCentral(newCentralName);
                  setNewCentralName('');
                }
              }}
            />
            <button 
              onClick={() => {
                if (newCentralName) {
                  onAddCentral(newCentralName);
                  setNewCentralName('');
                }
              }}
              disabled={!newCentralName || !!data[newCentralName]}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
            >
              Aggiungi
            </button>
          </div>

          <input 
            type="text"
            placeholder="Cerca centrale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {centrals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">Nessuna centrale trovata.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {centrals.map(name => (
                <div key={name} className="flex flex-col p-1 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                  <div className="group flex items-center justify-between p-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button 
                        onClick={() => setExpandedCentral(expandedCentral === name ? null : name)}
                        className={`p-1 rounded transition-colors ${expandedCentral === name ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        <PlusCircleIcon className={`w-5 h-5 transition-transform ${expandedCentral === name ? 'rotate-45' : ''}`} />
                      </button>
                      
                      {editingName === name ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input 
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-blue-500 rounded-lg focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingName(null);
                            }}
                          />
                          <button 
                            onClick={handleSaveEdit}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setEditingName(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => setExpandedCentral(expandedCentral === name ? null : name)}
                        >
                          {name}
                        </span>
                      )}
                    </div>

                    {!editingName && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleStartEdit(name)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Rinomina"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStartReplace(name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Elimina e Sostituisci"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {expandedCentral === name && (
                    <div className="mx-2 mb-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner space-y-4">
                      {/* Tipi di Consegna */}
                      {Object.entries(data[name] || {}).map(([tipo, reti]: [string, any]) => (
                        <div key={tipo} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/20">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{tipo}</h4>
                            <button onClick={() => handleRemoveTipo(name, tipo)} className="text-slate-400 hover:text-red-500">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            {Object.entries(reti || {}).map(([rete, fields]: [string, any]) => (
                              <div key={rete} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{rete}</span>
                                  <button onClick={() => handleRemoveRete(name, tipo, rete)} className="text-slate-400 hover:text-red-500">
                                    <XCircleIcon className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Apparato Transport</label>
                                    <input 
                                      type="text"
                                      value={fields.apparatoTransport}
                                      onChange={(e) => handleUpdateFields(name, tipo, rete, 'apparatoTransport', e.target.value)}
                                      className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Porta Apparato</label>
                                    <input 
                                      type="text"
                                      value={fields.portaApparato}
                                      onChange={(e) => handleUpdateFields(name, tipo, rete, 'portaApparato', e.target.value)}
                                      className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Apparato IP (NNI)</label>
                                    <input 
                                      type="text"
                                      value={fields.apparatoIpNni}
                                      onChange={(e) => handleUpdateFields(name, tipo, rete, 'apparatoIpNni', e.target.value)}
                                      className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">ID (ENRI/Command)</label>
                                    <input 
                                      type="text"
                                      value={fields.idEnriCommand}
                                      onChange={(e) => handleUpdateFields(name, tipo, rete, 'idEnriCommand', e.target.value)}
                                      className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-1 block">Posizione Apparato</label>
                                    <input 
                                      type="text"
                                      value={fields.posizioneApparato}
                                      onChange={(e) => handleUpdateFields(name, tipo, rete, 'posizioneApparato', e.target.value)}
                                      className="w-full px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="flex gap-2 pt-2">
                              <input 
                                type="text"
                                placeholder="Nuova Rete..."
                                value={newReteName}
                                onChange={(e) => setNewReteName(e.target.value)}
                                className="flex-1 px-2 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                              />
                              <button onClick={() => handleAddRete(name, tipo)} className="p-1 bg-blue-600 text-white rounded">
                                <PlusCircleIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <input 
                          type="text"
                          placeholder="Nuovo Tipo di Consegna..."
                          value={newTipoName}
                          onChange={(e) => setNewTipoName(e.target.value)}
                          className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                        />
                        <button onClick={() => handleAddTipo(name)} className="p-1.5 bg-blue-600 text-white rounded">
                          <PlusCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {replacingName === name && (
                    <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 uppercase tracking-wider">
                        Sostituisci "{name}" con:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {Object.keys(data)
                          .filter(n => n !== name)
                          .sort()
                          .map(target => (
                            <button
                              key={target}
                              onClick={() => handleConfirmReplace(target)}
                              className="w-full text-left px-3 py-1.5 text-xs bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-all truncate"
                            >
                              {target}
                            </button>
                          ))}
                      </div>
                      <button 
                        onClick={() => setReplacingName(null)}
                        className="mt-2 w-full py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 uppercase"
                      >
                        Annulla
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            Totale Centrali Terminazione: {centrals.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceTerminationManagementModal;
