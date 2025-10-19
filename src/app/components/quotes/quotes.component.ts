import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';
import { Quote, QuoteStatus } from '../../models/crm.models';

@Component({
  selector: 'app-quotes',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Quotes</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search quotes..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto order-first sm:order-none">
            <button (click)="uiService.activeColumnCustomization.set('quotes')" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Columns</button>
            <button (click)="uiService.openQuoteModal(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">
                Add Quote
            </button>
          </div>
      </div>
      
      <!-- Desktop Table View -->
      <div class="hidden md:block bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-900">
            <tr>
              @for(col of visibleColumns(); track col.id) {
                <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{{col.label}}</th>
              }
              <th class="px-4 py-3 border-b border-gray-700"></th>
            </tr>
          </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
              @for (quote of paginatedQuotes(); track quote.id) {
                <tr class="hover:bg-gray-700 cursor-pointer" (click)="uiService.openQuoteModal(quote)">
                  @if (isColumnVisible('quoteNumber')) {
                    <td class="px-4 py-3 text-sm font-medium text-indigo-400">{{quote.quoteNumber}}</td>
                  }
                  @if (isColumnVisible('opportunity')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{ getOpportunityName(quote.opportunityId) }}</td>
                  }
                  @if (isColumnVisible('status')) {
                    <td class="px-4 py-3 text-sm text-gray-300"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(quote.status)">{{ quote.status }}</span></td>
                  }
                  @if (isColumnVisible('total')) {
                    <td class="px-4 py-3 text-sm font-semibold text-gray-100">{{ quote.total | currency }}</td>
                  }
                   @if (isColumnVisible('createdAt')) {
                    <td class="px-4 py-3 text-sm text-gray-300">{{ quote.createdAt | date:'mediumDate' }}</td>
                  }
                  <td class="px-4 py-3 text-sm text-right">
                      <button (click)="$event.stopPropagation(); uiService.openQuotePreview(quote)" class="text-indigo-400 hover:text-indigo-300 font-medium">Preview</button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td [attr.colspan]="visibleColumns().length + 1" class="text-center py-8 text-gray-400">No quotes found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        @for (quote of paginatedQuotes(); track quote.id) {
          <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 cursor-pointer" (click)="uiService.openQuoteModal(quote)">
            <div class="flex justify-between items-start">
              <p class="font-bold text-indigo-400">{{ quote.quoteNumber }}</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(quote.status)">
                {{ quote.status }}
              </span>
            </div>
            <div class="mt-2">
              <p class="text-sm text-gray-400">For: {{ getOpportunityName(quote.opportunityId) }}</p>
              <p class="text-lg font-bold text-gray-100 mt-1">{{ quote.total | currency }}</p>
            </div>
            <div class="flex justify-between items-center mt-3 text-sm">
              <p class="text-gray-500">{{ quote.createdAt | date:'mediumDate' }}</p>
              <button (click)="$event.stopPropagation(); uiService.openQuotePreview(quote)" class="text-indigo-400 hover:text-indigo-300 font-medium">
                Preview
              </button>
            </div>
          </div>
        } @empty {
          <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8 text-center text-gray-400">
            No quotes found.
          </div>
        }
      </div>


       <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredQuotes().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg mt-4">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm text-gray-300">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredQuotes().length }}</span>
                results
              </p>
            </div>
            <div class="flex items-center space-x-4">
               <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
               </select>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="hidden sm:inline-flex relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> Page {{ currentPage() }} of {{ totalPages() }} </span>
                <span class="inline-flex sm:hidden relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> {{ currentPage() }} / {{ totalPages() }} </span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
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
export class QuotesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  searchTerm = signal('');

  constructor() {
    effect(() => {
      this.searchTerm();
      this.uiService.setCurrentPage('quotes', 1);
    });
  }

  columns = computed(() => this.uiService.tableColumnConfigs().quotes);
  visibleColumns = computed(() => this.columns().filter(c => c.visible));
  isColumnVisible = (id: string) => this.visibleColumns().some(c => c.id === id);

  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const allRoles = this.dataService.roles();
    if (!currentUser || !currentUser.roleId || !allRoles.length) return [];
    
    const userRole = allRoles.find(r => r.id === currentUser.roleId);
    if (!userRole || !userRole.name) return [];
  
    if (userRole.name === 'Admin') {
      return this.dataService.users().map(u => u.id);
    }
    
    if (userRole.name === 'Manager') {
      const teamMemberIds = this.dataService.users().filter(u => u.managerId === currentUser.id).map(u => u.id);
      return [currentUser.id, ...teamMemberIds];
    }
    
    return [currentUser.id]; // Sales Rep
  });

  private visibleQuotes = computed(() => this.dataService.quotes().filter(q => this.getVisibleUserIds().includes(q.ownerId)));

  filteredQuotes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.visibleQuotes().filter(quote => 
      quote.quoteNumber.toLowerCase().includes(term) ||
      this.getOpportunityName(quote.opportunityId).toLowerCase().includes(term)
    );
  });

  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['quotes'] || 1);
  totalPages = computed(() => {
    const total = this.filteredQuotes().length;
    const perPage = this.itemsPerPage();
    return total === 0 ? 0 : Math.ceil(total / perPage);
  });

  paginatedQuotes = computed(() => {
    const allQuotes = this.filteredQuotes();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allQuotes.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredQuotes().length;
    return total === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredQuotes().length);
  });

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('quotes', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }

  getOpportunityName(oppId: string): string {
    return this.dataService.opportunities().find(o => o.id === oppId)?.name || 'N/A';
