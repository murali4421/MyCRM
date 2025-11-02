import { Injectable, signal, WritableSignal, effect } from '@angular/core';
import { ColumnConfig } from '../models/crm.models';

type ColumnCustomizableTableName = 'companies' | 'contacts' | 'opportunities' | 'tasks' | 'activities' | 'projects' | 'leads' | 'quotes' | 'cases';
type PaginatedTableName = ColumnCustomizableTableName | 'audit-log' | 'email-templates' | 'users' | 'team-contacts' | 'products' | 'team-opportunities' | 'team-tasks';
type TableColumnConfigs = Record<ColumnCustomizableTableName, ColumnConfig[]>;

@Injectable({
  providedIn: 'root',
})
export class TableService {
  // Column customization state
  activeColumnCustomization = signal<ColumnCustomizableTableName | null>(null);
  tableColumnConfigs: WritableSignal<TableColumnConfigs> = signal({
    companies: [
      { id: 'name', label: 'Company Name', visible: true },
      { id: 'industry', label: 'Industry', visible: true },
      { id: 'website', label: 'Website', visible: true },
      { id: 'createdAt', label: 'Created At', visible: false },
    ],
    contacts: [
      { id: 'name', label: 'Name', visible: true },
      { id: 'email', label: 'Email', visible: true },
      { id: 'phone', label: 'Phone', visible: true },
      { id: 'company', label: 'Company', visible: true },
      { id: 'owner', label: 'Owner', visible: true },
    ],
    opportunities: [
      { id: 'name', label: 'Name', visible: true },
      { id: 'company', label: 'Company', visible: true },
      { id: 'stage', label: 'Stage', visible: true },
      { id: 'value', label: 'Value', visible: true },
      { id: 'closeDate', label: 'Close Date', visible: true },
      { id: 'owner', label: 'Owner', visible: true },
    ],
    tasks: [
      { id: 'title', label: 'Title', visible: true },
      { id: 'dueDate', label: 'Due Date', visible: true },
      { id: 'owner', label: 'Owner', visible: true },
      { id: 'relatedEntity', label: 'Related To', visible: true },
      { id: 'status', label: 'Status', visible: true },
    ],
    activities: [
      { id: 'type', label: 'Type', visible: true },
      { id: 'subject', label: 'Subject', visible: true },
      { id: 'owner', label: 'Owner', visible: true },
      { id: 'relatedEntity', label: 'Related To', visible: true },
      { id: 'date', label: 'Date', visible: true },
    ],
    projects: [
      { id: 'name', label: 'Project Name', visible: true },
      { id: 'company', label: 'Company', visible: true },
      { id: 'status', label: 'Status', visible: true },
      { id: 'budget', label: 'Budget', visible: true },
      { id: 'endDate', label: 'End Date', visible: true },
      { id: 'owner', label: 'Owner', visible: false },
    ],
    leads: [
      { id: 'name', label: 'Name', visible: true },
      { id: 'companyName', label: 'Company', visible: true },
      { id: 'email', label: 'Email', visible: true },
      { id: 'status', label: 'Status', visible: true },
      { id: 'source', label: 'Source', visible: true },
      { id: 'owner', label: 'Owner', visible: true },
    ],
    quotes: [
      { id: 'quoteNumber', label: 'Number', visible: true },
      { id: 'opportunity', label: 'Opportunity', visible: true },
      { id: 'status', label: 'Status', visible: true },
      { id: 'total', label: 'Total', visible: true },
      { id: 'createdAt', label: 'Created At', visible: true },
    ],
    cases: [
      { id: 'caseNumber', label: 'Case Number', visible: true },
      { id: 'subject', label: 'Subject', visible: true },
      { id: 'contact', label: 'Contact', visible: true },
      { id: 'status', label: 'Status', visible: true },
      { id: 'priority', label: 'Priority', visible: true },
      { id: 'owner', label: 'Owner', visible: false },
    ]
  });

  // Pagination State
  pagination = signal<{
    itemsPerPage: number;
    currentPage: { [key in PaginatedTableName]?: number };
  }>({
    itemsPerPage: 10,
    currentPage: {},
  });
  
  constructor() {
    this.loadPaginationFromLocalStorage();

    // Persist items per page setting
    effect(() => {
      const itemsPerPage = this.pagination().itemsPerPage;
      localStorage.setItem('crm-items-per-page', JSON.stringify(itemsPerPage));
    });
  }

  private loadPaginationFromLocalStorage() {
    const storedItemsPerPage = localStorage.getItem('crm-items-per-page');
    if (storedItemsPerPage) {
      try {
        const parsed = JSON.parse(storedItemsPerPage);
        if (typeof parsed === 'number' && [9, 10, 12, 24, 25, 50].includes(parsed)) {
          this.pagination.update(p => ({ ...p, itemsPerPage: parsed }));
        }
      } catch (e) {
        console.error('Could not parse stored pagination state', e);
      }
    }
  }
  
  // --- Pagination Management ---
  setItemsPerPage(count: number) {
    this.pagination.update(p => ({
      itemsPerPage: count,
      currentPage: {} // Reset all pages when items per page changes
    }));
  }

  setCurrentPage(table: PaginatedTableName, page: number) {
    this.pagination.update(p => ({
      ...p,
      currentPage: {
        ...p.currentPage,
        [table]: page
      }
    }));
  }
}
