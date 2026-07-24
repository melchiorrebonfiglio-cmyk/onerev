
import React, { useState, useMemo } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TIPO_APPARATI } from '../constants';

interface InfrastructureManagementModalProps {
  infrastructureData: Record<string, Record<string, string[]>>;
  onRenameCentral: (oldName: string, newName: string) => void;
  onDeleteCentral: (name: string) => void;
  onAddCentral: (name: string) => void;
  onUpdateInfrastructure: (centralName: string, data: Record<string, string[]>) => void;
  onResetToDefault?: () => void;
  onClose: () => void;
}

const InfrastructureManagementModal: React.FC<InfrastructureManagementModalProps> = ({ 
  infrastructureData, 
  onRenameCentral, 
  onDeleteCentral,
  onAddCentral,
  onUpdateInfrastructure,
  onResetToDefault,
  onClose 
}) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [replacingName, setReplacingName] = useState<string | null>(null);
  const [deletingCentral, setDeletingCentral] = useState<string | null>(null);
  const [expandedCentral, setExpandedCentral] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [newCentralName, setNewCentralName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApparato, setSelectedApparato] = useState('');

  const centrals = useMemo(() => {
    const list = Object.keys(infrastructureData).sort();
    if (!searchTerm) return list;
    return list.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [infrastructureData, searchTerm]);

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

  const handleAddApparato = (centralName: string) => {
    if (!selectedApparato) return;
    const currentData = { ...infrastructureData[centralName] };
    if (!currentData[selectedApparato]) {
      currentData[selectedApparato] = [];
      onUpdateInfrastructure(centralName, currentData);
    }
    setSelectedApparato('');
  };

  const handleRemoveApparato = (centralName: string, apparato: string) => {
    const currentData = { ...infrastructureData[centralName] };
    delete currentData[apparato];
    onUpdateInfrastructure(centralName, currentData);
  };

  const handleUpdatePosition = (centralName: string, apparato: string, position: string) => {
    const currentData = { ...infrastructureData[centralName] };
    currentData[apparato] = position ? [position] : [];
    onUpdateInfrastructure(centralName, currentData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-bottom border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gestione Centrali</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Modifica nomi, apparati o elimina duplicati.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <XCircleIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Nome nuova centrale..."
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
              disabled={!newCentralName || !!infrastructureData[newCentralName]}
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
                            className="flex-1 max-w-[200px] md:max-w-xs px-3 py-1 text-sm bg-white dark:bg-slate-900 border border-blue-500 rounded-lg focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingName(null);
                            }}
                          />
                          <button 
                            onClick={handleSaveEdit}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex-shrink-0"
                            title="Salva"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setEditingName(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                            title="Annulla"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span 
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => setExpandedCentral(expandedCentral === name ? null : name)}
                          >
                            {name}
                          </span>
                          
                          {deletingCentral === name ? (
                            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg border border-red-200/50 dark:border-red-900/30 flex-shrink-0 animate-in fade-in duration-200">
                              <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">Eliminare?</span>
                              <button
                                onClick={() => {
                                  onDeleteCentral(name);
                                  setDeletingCentral(null);
                                }}
                                className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded hover:bg-red-700 transition-colors"
                              >
                                Sì
                              </button>
                              <button
                                onClick={() => setDeletingCentral(null)}
                                className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button 
                                onClick={() => handleStartEdit(name)}
                                className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                title="Modifica"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeletingCentral(name)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                title="Elimina"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedCentral === name && (
                    <div className="mx-2 mb-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apparati Attestazione Fibra</h4>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {Object.keys(infrastructureData[name] || {}).length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Nessun apparato configurato.</p>
                        ) : (
                          Object.entries(infrastructureData[name] || {}).map(([app, positions]) => (
                            <div key={app} className="flex items-center gap-2 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 truncate">{app}</span>
                                  <button 
                                    onClick={() => handleRemoveApparato(name, app)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                  >
                                    <XCircleIcon className="w-4 h-4" />
                                  </button>
                                </div>
                                <input 
                                  type="text"
                                  placeholder="Posizione Apparato..."
                                  value={positions[0] || ''}
                                  onChange={(e) => handleUpdatePosition(name, app, e.target.value)}
                                  className="w-full px-2 py-1 text-[11px] bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <select 
                          value={selectedApparato}
                          onChange={(e) => setSelectedApparato(e.target.value)}
                          className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleziona apparato...</option>
                          {TIPO_APPARATI.filter(a => !Object.keys(infrastructureData[name] || {}).includes(a)).map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleAddApparato(name)}
                          disabled={!selectedApparato}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                        >
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
                        {Object.keys(infrastructureData)
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

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            Totale Centrali: {centrals.length}
          </p>
          {onResetToDefault && (
            <button
              onClick={onResetToDefault}
              className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors bg-red-50 dark:bg-red-950/20 px-2.5 py-1.5 rounded-lg border border-red-200/50 dark:border-red-900/30"
            >
              Ripristina Default
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureManagementModal;
