import React from 'react';

export type FilterType = 'all' | 'no_mgt' | 'no_doc' | 'ready_for_close';

interface ProjectListFiltersProps {
  activeFilter: FilterType;
  onChangeFilter: (filter: FilterType) => void;
  filterCounts: {
      no_mgt: number;
      no_doc: number;
      ready_for_close: number;
  }
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Tutti i progetti' },
  { value: 'no_mgt', label: 'Senza Configurazione IP MGT' },
  { value: 'no_doc', label: 'Senza Documentazione' },
  { value: 'ready_for_close', label: 'Pronti per Chiusura' },
];

const ProjectListFilters: React.FC<ProjectListFiltersProps> = ({ activeFilter, onChangeFilter, filterCounts }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="project-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Filtra per:</label>
      <select
        id="project-filter"
        value={activeFilter}
        onChange={(e) => onChangeFilter(e.target.value as FilterType)}
        className="block w-full min-w-[240px] rounded-md border-0 bg-white dark:bg-slate-800 py-2 pl-3 pr-8 text-slate-900 dark:text-slate-200 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition"
      >
        {filterOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.value !== 'all' && filterCounts[option.value as keyof typeof filterCounts] > 0 ? ` (${filterCounts[option.value as keyof typeof filterCounts]})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProjectListFilters;
