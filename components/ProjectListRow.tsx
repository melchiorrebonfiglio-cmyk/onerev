

import React, { useMemo } from 'react';
import { Project } from '../types';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ProjectListRowProps {
  project: Project;
  rowIndex: number;
  onViewDetails: (projectId: string) => void;
  onToggleActivity: (projectId: string, activityId: number, commandData?: { idCommand: string, namingServizio: string }) => void;
  onDuplicateActivity: (projectId: string, activityId: number) => void;
  onChangeProjectStatus: (projectId: string, newStatus: Project['status']) => void;
  onOpenEditModal: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const calculateBusinessDays = (startDateStr?: string | null, endDateStr?: string | null): number | null => {
  if (!startDateStr || !endDateStr) {
    return null;
  }

  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate > endDate) {
        return null;
    }

    let businessDays = 0;
    const current = new Date(startDate);
    
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (current.getTime() === end.getTime()) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) { // It's a weekday
            return 1;
        }
        return 0;
    }
    
    // Set current to the start of the next day to avoid counting the start date if it's the same day
    current.setDate(current.getDate() + 1);

    while(current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) { // 0=Sunday, 6=Saturday
            businessDays++;
        }
        current.setDate(current.getDate() + 1);
    }

    return businessDays;
  } catch (e) {
    console.error("Error calculating business days", e);
    return null;
  }
};

const isValValid = (val: string | undefined | null): boolean => {
  if (!val) return false;
  const stripped = val.trim();
  return stripped.toUpperCase() !== 'N/A' && stripped !== '';
};


const ProjectListRow: React.FC<ProjectListRowProps> = ({ 
  project, 
  rowIndex,
  onViewDetails,
  onToggleActivity, 
  onDuplicateActivity,
  onChangeProjectStatus,
  onOpenEditModal,
  onDeleteProject
}) => {
  const { idOrdineVal, idOdfVal } = useMemo(() => {
    const cleanVal = (val: string | undefined | null) => {
      if (!val) return null;
      const stripped = val.trim();
      if (stripped.toUpperCase() === 'N/A' || stripped === '') return null;
      return stripped;
    };
    return {
      idOrdineVal: cleanVal(project.ordine?.idOrdine) || cleanVal(project.id),
      idOdfVal: cleanVal(project.ordine?.idOdf),
    };
  }, [project.ordine, project.id]);
  
  const isPending = project.status === 'pending';
  const isClosed = project.status === 'closed';
  const isArchived = project.status === 'archived';
  const isDisabled = isPending || isClosed || isArchived;
  const isEvenRow = rowIndex % 2 === 1;
  const rowBgClass = isEvenRow ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800';
  

  const statusIndicator = {
    'on going': <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" title="In Corso"></div>,
    'closed': <div className="h-2.5 w-2.5 rounded-full bg-green-500 mt-1 flex-shrink-0" title="Chiuso"></div>,
    'pending': <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 mt-1 flex-shrink-0" title="In Sospeso"></div>,
    'archived': <div className="h-2.5 w-2.5 rounded-full bg-slate-500 mt-1 flex-shrink-0" title="Archiviato"></div>,
  }[project.status];

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Data non valida';
    }
  };
  
  const formatDateForTooltip = (isoString: string | null | undefined) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return '';
    }
  };

  const getActivityDotClass = (activity: Project['activities'][0]) => {
      if (activity.subTask) { // It's a parent activity
          if (activity.subTask.completed) {
              return 'bg-green-500'; // Fully completed
          }
          if (activity.completed) {
              return 'bg-yellow-500'; // Parent task done, waiting for sub-task
          }
      } else if (activity.completed) {
          return 'bg-green-500'; // Standard activity completed
      }
      return 'bg-slate-600 dark:bg-slate-500'; // Incomplete
  };

  const getActivityDotTitle = (activity: Project['activities'][0]) => {
      const completionDate = activity.subTask?.completedAt ?? activity.completedAt;

      if (activity.subTask) { // Parent activity
          if (activity.subTask.completed && completionDate) {
              return `${activity.name} (Completata il: ${formatDateForTooltip(completionDate)})`;
          }
          if (activity.completed) {
              return `${activity.name} (In attesa di '${activity.subTask.name}')`;
          }
      } else if (activity.completed && completionDate) { // Standard activity
          return `${activity.name} (Completata il: ${formatDateForTooltip(completionDate)})`;
      }
      return activity.name; // Incomplete
  };


  return (
    <React.Fragment>
      <tr className={`border-b border-slate-200 dark:border-slate-700 ${rowBgClass} hover:bg-sky-100 dark:hover:bg-slate-700/60 transition-colors duration-150 ${isDisabled ? 'opacity-60' : ''}`}>
        <th 
            scope="row" 
            onClick={() => onViewDetails(project.id)}
            className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap cursor-pointer"
        >
          <div className="flex items-start gap-2 text-left w-full group">
            {statusIndicator}
            <div className="flex flex-col">
                <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-mono">{idOrdineVal}</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                    Creato: {formatDate(project.createdAt)}
                </span>
            </div>
          </div>
        </th>
        <td 
            onClick={() => onViewDetails(project.id)}
            className="px-6 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors font-mono font-semibold text-slate-800 dark:text-slate-200"
        >
          {idOdfVal || '-'}
        </td>
        <td 
            onClick={() => onViewDetails(project.id)}
            className="px-6 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
             {project.ragioneSociale}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              {project.activities.map(activity => (
                <span
                  key={activity.id}
                  title={getActivityDotTitle(activity)}
                  className={`block h-3 w-3 rounded-full ${getActivityDotClass(activity)}`}
                ></span>
              ))}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Modif.: {formatDate(project.updatedAt)}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
            <select
              value={project.status}
              onChange={(e) => onChangeProjectStatus(project.id, e.target.value as Project['status'])}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <option value="on going">Attivo</option>
              <option value="pending">In Sospeso</option>
              {/* The 'Closed' option is only available if the project is already closed.
                  This prevents manually closing a project. Closure is automatic when all tasks are done. */}
              {project.status === 'closed' && <option value="closed">Chiuso</option>}
              {project.status === 'archived' && <option value="archived">Archiviato</option>}
            </select>
        </td>
        <td className="px-6 py-4">
           {project.status !== 'archived' && (
            <div className="flex items-center justify-end space-x-2">
                <button
                    onClick={() => onOpenEditModal(project)}
                    title="Modifica Progetto"
                    disabled={isDisabled}
                    className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={() => onDeleteProject(project.id)}
                    title="Elimina Progetto"
                    disabled={isDisabled}
                    className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
            )}
        </td>
      </tr>
    </React.Fragment>
  );
};

export default ProjectListRow;