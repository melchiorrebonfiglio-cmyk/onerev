import React from 'react';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';

interface ProjectFilterProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isFilterActive: boolean;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({ value, onChange, onSearch, onClear, isFilterActive }) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex gap-2 items-center w-full max-w-lg">
      <div className="relative flex-grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="text"
          placeholder="Cerca per Ragione Sociale o CRQ..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border-0 bg-white dark:bg-slate-800 py-2 pl-10 pr-3 text-slate-900 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
      >
        Avvia Ricerca
      </button>
      {isFilterActive && (
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
          title="Pulisci la ricerca"
        >
          Pulisci Ricerca
        </button>
      )}
    </form>
  );
};

export default ProjectFilter;