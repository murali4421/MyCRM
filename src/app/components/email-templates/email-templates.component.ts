import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { EmailTemplate } from '../../models/crm.models';

@Component({
  selector: 'app-email-templates',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Email Templates</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search templates..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-48 order-first sm:order-none">
            <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto">
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
            <button (click)="uiService.openTemplateEditor(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium whitespace-nowrap">New Template</button>
          </div>
      </div>

      <!-- Card Grid View -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (template of paginatedTemplates(); track template.id) {
          <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 flex flex-col">
            <div class="p-4 flex-grow">
              <h3 class="font-bold text-gray-100 truncate">{{template.name}}</h3>
              <p class="text-sm text-gray-300 mt-1 truncate" title="{{template.subject}}">Subject: {{template.subject}}</p>
              <p class="text-xs text-gray-500 mt-2">Created: {{template.createdAt | date:'mediumDate'}}</p>
              <div class="mt-3 text-sm text-gray-400 h-20 overflow-hidden relative">
                <p>{{ getSanitizedBodyPreview(template.body) }}</p>
                <div class="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-800 to-transparent"></div>
              </div>
            </div>
            <div class="p-3 bg-gray-900 border-t border-gray-700 flex items-center justify-end space-x-2">
              <button (click)="previewTemplate(template)" class="text-sm font-medium text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700">Preview</button>
              <button (click)="editTemplate(template)" class="text-sm font-medium text-gray-300 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700">Edit</button>
              <div class="relative">
                 <button (click)="toggleDropdown(template.id)" class="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                 </button>
                 @if(openDropdown() === template.id) {
                    <div class="absolute right-0 bottom-8 mt-2 w-40 bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-700">
                      <a href="#" (click)="$event.preventDefault(); duplicateTemplate(template)" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">Duplicate</a>
                      <a href="#" (click)="$event.preventDefault(); deleteTemplate(template.id)" class="block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">Delete</a>
                    </div>
                 }
              </div>
            </div>
          </div>
        }
        @empty {
          <div class="col-span-full text-center py-16 text-gray-400">
            <h3 class="text-lg font-semibold">No email templates found.</h3>
            <p class="mt-1">Create one to get started!</p>
          </div>
        }
      </div>

      <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredTemplates().length > 0) {
        <div class="flex items-center justify-between mt-6 py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-lg shadow-sm">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm text-gray-300">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredTemplates().length }}</span>
                results
              </p>
            </div>
            <div class="flex items-center space-x-4">
               <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                  <option [ngValue]="9">9 per page</option>
                  <option [ngValue]="12">12 per page</option>
                  <option [ngValue]="24">24 per page</option>
               </select>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="hidden sm:inline-flex relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> Page {{ currentPage() }} of {{ totalPages() }} </span>
                <span class="inline-flex sm:hidden relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> {{ currentPage() }} / {{ totalPages() }} </span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplatesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);

  searchTerm = signal('');
  sortBy = signal<'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'>('created_desc');
  openDropdown = signal<string | null>(null);

  constructor() {
    effect(() => {
      // Reset page when search/sort changes
      this.searchTerm();
      this.sortBy();
      this.uiService.setCurrentPage('email-templates', 1);
    });

    if (![9, 12, 24].includes(this.uiService.pagination().itemsPerPage)) {
      this.uiService.setItemsPerPage(9);
    }
  }

  filteredTemplates = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const sort = this.sortBy();

    let templates = this.dataService.emailTemplates().filter(t => 
      t.name.toLowerCase().includes(term) ||
      t.subject.toLowerCase().includes(term)
    );

    return [...templates].sort((a, b) => {
      switch(sort) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'created_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'created_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return 0;
      }
    });
  });

  // Pagination signals
  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['email-templates'] || 1);
  
  totalPages = computed(() => {
    const total = this.filteredTemplates().length;
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedTemplates = computed(() => {
    const templates = this.filteredTemplates();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return templates.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredTemplates().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredTemplates().length);
  });

  // Methods
  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('email-templates', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }

  getSanitizedBodyPreview(body: string): string {
    if (!body) return 'No content.';
    return body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150);
  }

  toggleDropdown(templateId: string) {
    this.openDropdown.update(current => current === templateId ? null : templateId);
  }

  previewTemplate(template: EmailTemplate) {
    this.uiService.openTemplatePreview(template);
  }
  
  editTemplate(template: EmailTemplate) {
    this.uiService.openTemplateEditor(template);
  }

  async duplicateTemplate(template: EmailTemplate) {
    await this.dataService.duplicateTemplate(template);
    this.toggleDropdown(template.id);
  }

  async deleteTemplate(templateId: string) {
    if (confirm('Are you sure you want to delete this template?')) {
      await this.dataService.deleteTemplate(templateId);
    }
    this.toggleDropdown(templateId);
  }
}
