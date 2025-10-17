import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoggingService } from '../../services/logging.service';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-audit-log',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold text-gray-100">Audit Log</h1>
      </div>
      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-900">
            <tr>
              <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
              <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
              <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
              <th class="px-4 py-3 border-b border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
              @for (log of paginatedLogs(); track log.id) {
                <tr class="hover:bg-gray-700">
                  <td class="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{{log.timestamp | date:'medium'}}</td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-100">{{ dataService.getUserById(log.userId)?.name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-300"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300">{{ log.action }}</span></td>
                  <td class="px-4 py-3 text-sm text-gray-300">{{log.details}}</td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="4" class="text-center py-8 text-gray-400">No audit logs found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>
       <!-- Pagination Controls -->
      @if (totalPages() > 0 && allLogs().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm text-gray-300">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ allLogs().length }}</span>
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
export class AuditLogComponent {
  loggingService = inject(LoggingService);
  dataService = inject(DataService);
  uiService = inject(UiService);

  // Pagination signals
  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['audit-log'] || 1);
  
  allLogs = this.loggingService.logs;

  totalPages = computed(() => {
    const total = this.allLogs().length;
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedLogs = computed(() => {
    const logs = this.allLogs();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return logs.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.allLogs().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.allLogs().length);
  });

  // Methods to handle pagination changes
  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('audit-log', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }
}
