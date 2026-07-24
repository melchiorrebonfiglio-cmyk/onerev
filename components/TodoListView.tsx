import React, { useMemo } from 'react';
import { Project, Todo } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';

interface FlatTodo extends Todo {
  projectId: string;
  projectRagioneSociale: string;
  activityId: number;
  activityName: string;
}

interface TodoListViewProps {
  projects: Project[];
  onToggleTodo: (projectId: string, activityId: number, todoId: number) => void;
  onSelectProject: (projectId: string) => void;
}

const TodoListView: React.FC<TodoListViewProps> = ({ projects, onToggleTodo, onSelectProject }) => {
  const flatTodos = useMemo(() => {
    const allTodos: FlatTodo[] = [];
    projects.forEach(project => {
      // Show todos only for active projects
      if (project.status === 'on going') {
        project.activities.forEach(activity => {
          // An activity must be "checked" (meaning work is delegated) to show its todos
          if (activity.completed && activity.todos && activity.todos.length > 0) {
            activity.todos.forEach(todo => {
              allTodos.push({
                ...todo,
                projectId: project.id,
                projectRagioneSociale: project.ragioneSociale,
                activityId: activity.id,
                activityName: activity.name,
              });
            });
          }
        });
      }
    });
    return allTodos;
  }, [projects]);

  if (flatTodos.length === 0) {
    return (
      <div className="mt-16 text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md">
        <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500" />
        <h2 className="mt-4 text-2xl font-semibold text-slate-500 dark:text-slate-400">Nessuna attività "DA FARE" in corso.</h2>
        <p className="mt-2 text-slate-400 dark:text-slate-500">
            Per popolare questa lista, vai alla scheda di un progetto, spunta un'attività principale e aggiungi un promemoria "DA FARE".
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 p-4 md:px-6 border-b border-slate-200 dark:border-slate-700">
        Lista Generale TO DO
      </h2>
      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
        <thead className="text-sm text-slate-800 dark:text-slate-200 uppercase bg-slate-200 dark:bg-slate-700 font-semibold tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-3 min-w-[200px]">Progetto (CRQ)</th>
            <th scope="col" className="px-6 py-3 min-w-[250px]">Ragione Sociale</th>
            <th scope="col" className="px-6 py-3 min-w-[250px]">Attività Principale</th>
            <th scope="col" className="px-6 py-3">Compito "DA FARE"</th>
            <th scope="col" className="px-6 py-3 text-center">Stato</th>
          </tr>
        </thead>
        <tbody>
          {flatTodos.map((todo, index) => (
            <tr 
              key={`${todo.projectId}-${todo.id}`} 
              className={`border-b border-slate-200 dark:border-slate-700 transition-colors duration-150 ${index % 2 === 1 ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800'}`}
            >
              <td 
                onClick={() => onSelectProject(todo.projectId)} 
                className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Visualizza dettagli progetto"
              >
                {todo.projectId}
              </td>
              <td className="px-6 py-4">{todo.projectRagioneSociale}</td>
              <td className="px-6 py-4">{todo.activityName}</td>
              <td className={`px-6 py-4 ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                {todo.text}
              </td>
              <td className="px-6 py-4 text-center">
                 <label className="inline-flex items-center justify-center cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => onToggleTodo(todo.projectId, todo.activityId, todo.id)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                 </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TodoListView;
