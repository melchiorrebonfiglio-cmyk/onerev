import React from 'react';
import { Project } from '../types';
import ProjectListRow from './ProjectListRow';

interface ProjectListViewProps {
  projects: Project[];
  onToggleActivity: (projectId: string, activityId: number, commandData?: { idCommand: string, namingServizio: string }) => void;
  onDuplicateActivity: (projectId: string, activityId: number) => void;
  onChangeProjectStatus: (projectId: string, newStatus: Project['status']) => void;
  onOpenEditModal: (project: Project) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectListView: React.FC<ProjectListViewProps> = ({ projects, onToggleActivity, onDuplicateActivity, onChangeProjectStatus, onOpenEditModal, onSelectProject, onDeleteProject }) => {
  return (
    <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
        <thead className="text-sm text-slate-800 dark:text-slate-200 uppercase bg-slate-200 dark:bg-slate-700 font-semibold tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-3 min-w-[150px]">
              ID ORDINE
            </th>
            <th scope="col" className="px-6 py-3 min-w-[150px]">
              ID ODF
            </th>
            <th scope="col" className="px-6 py-3 min-w-[250px]">
              RAGIONE SOCIALE
            </th>
            <th scope="col" className="px-6 py-3">
              ATTIVITÀ
            </th>
            <th scope="col" className="px-6 py-3">
              STATO
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              AZIONI
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <ProjectListRow 
              key={project.id} 
              project={project}
              rowIndex={index}
              onViewDetails={onSelectProject}
              onToggleActivity={onToggleActivity}
              onDuplicateActivity={onDuplicateActivity}
              onChangeProjectStatus={onChangeProjectStatus}
              onOpenEditModal={onOpenEditModal}
              onDeleteProject={onDeleteProject}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectListView;
