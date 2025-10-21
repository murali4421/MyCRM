import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';
import { Quote, QuoteStatus } from '../../models/crm.models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-quotes',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Quotes</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search quotes..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto order-first sm:order-none"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
            <button (click)="uiService.activeColumnCustomization.set('quotes')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Columns</button>
            <button (click)="uiService.openQuoteModal(null)" class="px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('text-on-accent')">
                Add Quote
            </button>
          </div>
      </div>
      
      <!-- Desktop Table View -->
      <div class="hidden md:block rounded-lg shadow-sm border overflow-x-auto" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
        <table class="min-w-full">
          <thead [class]="themeService.c('bg-base')">
            <tr>
              @for(col of visibleColumns(); track col.id) {
                <th class="px-4 py-3 border-b text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">{{col.label}}</th>
              }
              <th class="px-4 py-3 border-b" [class]="themeService.c('border-primary')"></th>
            </tr>
          </thead>
            <tbody class="divide-y" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
              @for (quote of paginatedQuotes(); track quote.id) {
                <tr class="cursor-pointer" [class]="themeService.c('bg-primary-hover')" (click)="uiService.openQuoteModal(quote)">
                  @if (isColumnVisible('quoteNumber')) {
                    <td class="px-4 py-3 text-sm font-medium" [class]="themeService.c('text-accent')">{{quote.quoteNumber}}</td>
                  }
                  @if (isColumnVisible('opportunity')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ getOpportunityName(quote.opportunityId) }}</td>
                  }
                  @if (isColumnVisible('status')) {
                    <td class="px-4 py-3 text-sm"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(quote.status)">{{ quote.status }}</span></td>
                  }
                  @if (isColumnVisible('total')) {
                    <td class="px-4 py-3 text-sm font-semibold" [class]="themeService.c('text-primary')">{{ quote.total | currency }}</td>
                  }
                   @if (isColumnVisible('createdAt')) {
                    <td class="px-4 py-3 text-sm" [class]="themeService.c('text-base')">{{ quote.createdAt | date:'mediumDate' }}</td>
                  }
                  <td class="px-4 py-3 text-sm text-right">
                      <button (click)="$event.stopPropagation(); uiService.openQuotePreview(quote)" class="font-medium" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover')">Preview</button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td [attr.colspan]="visibleColumns().length + 1" class="text-center py-8" [class]="themeService.c('text-secondary')">No quotes found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        @for (quote of paginatedQuotes(); track quote.id) {
          <div class="p-4 cursor-pointer rounded-lg shadow-sm border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')" (click)="uiService.openQuoteModal(quote)">
            <div class="flex justify-between items-start">
              <p class="font-bold" [class]="themeService.c('text-accent')">{{ quote.quoteNumber }}</p>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getStatusBadgeClass(quote.status)">
                {{ quote.status }}
              </span>
            </div>
            <div class="mt-2">
              <p class="text-sm" [class]="themeService.c('text-secondary')">For: {{ getOpportunityName(quote.opportunityId) }}</p>
              <p class="text-lg font-bold mt-1" [class]="themeService.c('text-primary')">{{ quote.total | currency }}</p>
            </div>
            <div class="flex justify-between items-center mt-3 text-sm">
              <p [class]="themeService.c('text-tertiary')">{{ quote.createdAt | date:'mediumDate' }}</p>
              <button (click)="$event.stopPropagation(); uiService.openQuotePreview(quote)" class="font-medium" [class]="themeService.c('text-accent') + ' ' + themeService.c('hover:text-accent-hover')">
                Preview
              </button>
            </div>
          </div>
        } @empty {
          <div class="p-8 text-center rounded-lg shadow-sm border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">
            No quotes found.
          </div>
        }
      </div>


       <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredQuotes().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 mt-4 border-t rounded-b-lg" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm" [class]="themeService.c('text-base')">
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
               <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md focus:outline-none text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-2') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
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
export class QuotesComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

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
    const userRole = this.authService.currentUserRole();
    if (!currentUser || !userRole) return [];

    const tenantUsers = this.dataService.users().filter(u => u.companyId === currentUser.companyId);
  
    if (userRole.name === 'Admin') {
      return tenantUsers.map(u => u.id);
    }
    
    if (userRole.name === 'Manager') {
      const teamMemberIds = tenantUsers.filter(u => u.managerId === currentUser.id).map(u => u.id);
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
  }

  getStatusBadgeClass(status: QuoteStatus): string {
    const map: Record<QuoteStatus, string> = {
      [QuoteStatus.Draft]: this.themeService.c('bg-secondary') + ' ' + this.themeService.c('text-base'),
      [QuoteStatus.Sent]: this.themeService.c('bg-info-subtle') + ' ' + this.themeService.c('text-info'),
      [QuoteStatus.Accepted]: this.themeService.c('bg-success-subtle') + ' ' + this.themeService.c('text-success'),
      [QuoteStatus.Declined]: this.themeService.c('bg-danger-subtle') + ' ' + this.themeService.c('text-danger'),
    };
    return map[status];
  }
}