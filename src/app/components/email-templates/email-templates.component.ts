import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ModalService } from '../../services/modal.service';
import { TableService } from '../../services/table.service';
import { EmailTemplate } from '../../models/crm.models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-email-templates',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Email Templates</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search templates..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-48 order-first sm:order-none"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
            <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
            <button (click)="modalService.openTemplateEditor(null)" class="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('text-on-accent')">New Template</button>
          </div>
      </div>

      <!-- Card Grid View -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (template of paginatedTemplates(); track template.id) {
          <div class="rounded-lg shadow-sm border flex flex-col" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
            <div class="p-4 flex-grow">
              <h3 class="font-bold truncate" [class]="themeService.c('text-primary')">{{template.name}}</h3>
              <p class="text-sm mt-1 truncate" [class]="themeService.c('text-base')" title="{{template.subject}}">Subject: {{template.subject}}</p>
              <p class="text-xs mt-2" [class]="themeService.c('text-tertiary')">Created: {{template.createdAt | date:'mediumDate'}}</p>
              <div class="mt-3 text-sm h-20 overflow-hidden relative" [class]="themeService.c('text-secondary')">
                <p>{{ getSanitizedBodyPreview(template.body) }}</p>
                <div class="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t to-transparent" [class]="themeService.c('gradient-from-primary')"></div>
              </div>
            </div>
            <div class="p-3 border-t flex items-center justify-end space-x-2" [class]="themeService.c('bg-base') + ' ' + themeService.c('border-primary')">
              <button (click)="previewTemplate(template)" class="text-sm font-medium px-3 py-1 rounded-md" [class]="themeService.c('text-base') + ' ' + themeService.c('bg-primary-hover')">Preview</button>
              <button (click)="dataService.duplicateTemplate(template)" class="text-sm font-medium px-3 py-1 rounded-md" [class]="themeService.c('text-base') + ' ' + themeService.c('bg-primary-hover')">Duplicate</button>
              <button (click)="modalService.openTemplateEditor(template)" class="text-sm font-medium" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover')">Edit</button>
            </div>
          </div>
        }
        @empty {
            <div class="col-span-full text-center py-16" [class]="themeService.c('text-secondary')">
                <h3 class="text-lg font-semibold">No templates found.</h3>
                <p class="mt-1">Create one to get started!</p>
            </div>
        }
      </div>
      
       <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredTemplates().length > 0) {
        <div class="flex items-center justify-between mt-6 py-3 px-4 border-t rounded-lg" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm" [class]="themeService.c('text-base')">
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
               <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md focus:outline-none text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-2') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                  <option [ngValue]="9">9 per page</option>
                  <option [ngValue]="12">12 per page</option>
                  <option [ngValue]="24">24 per page</option>
               </select>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="hidden sm:inline-flex relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> Page {{ currentPage() }} of {{ totalPages() }} </span>
                <span class="inline-flex sm:hidden relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> {{ currentPage() }} / {{ totalPages() }} </span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                  <span class="sr-only">Next</span>
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
  modalService = inject(ModalService);
  tableService = inject(TableService);
  themeService = inject(ThemeService);

  searchTerm = signal('');
  sortBy = signal<'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'>('created_desc');

  constructor() {
     effect(() => {
      // When filters change, reset page to 1
      this.searchTerm();
      this.sortBy();
      this.tableService.setCurrentPage('email-templates', 1);
    });

    if (![9, 12, 24].includes(this.tableService.pagination().itemsPerPage)) {
      this.tableService.setItemsPerPage(9);
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

  // Pagination
  itemsPerPage = computed(() => this.tableService.pagination().itemsPerPage);
  currentPage = computed(() => this.tableService.pagination().currentPage['email-templates'] || 1);
  totalPages = computed(() => {
    const total = this.filteredTemplates().length;
    return total > 0 ? Math.ceil(total / this.itemsPerPage()) : 0;
  });

  paginatedTemplates = computed(() => {
    const all = this.filteredTemplates();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return all.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    return this.filteredTemplates().length > 0 ? (this.currentPage() - 1) * this.itemsPerPage() + 1 : 0;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredTemplates().length);
  });
  
  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.tableService.setCurrentPage('email-templates', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.tableService.setItemsPerPage(Number(value));
  }

  getSanitizedBodyPreview(body: string): string {
    return body.replace(/<[^>]*>?/gm, '').substring(0, 150);
  }

  previewTemplate(template: EmailTemplate) {
    this.modalService.openTemplatePreview(template);
  }
}
