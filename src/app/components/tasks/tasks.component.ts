import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/crm.models';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Tasks</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search tasks..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto order-first sm:order-none"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto" [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <button (click)="uiService.activeColumnCustomization.set('tasks')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Columns</button>
            <button (click)="openAddTaskModal()"
              [title]="isTaskManagementEnabled() ? 'Add a new task' : 'Task management is not available on your plan. Please upgrade.'"
              class="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              [class.cursor-not-allowed]="!isTaskManagementEnabled()"
              [class]="(isTaskManagementEnabled() ? themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') : themeService.c('bg-disabled')) + ' ' + themeService.c('text-on-accent')">
              Add Task
            </button>
          </div>
      </div>
      <div class="rounded-lg shadow-sm border overflow-x-auto" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
        <table class="min-w-full">
          <thead [class]="themeService.c('bg-base')">
            <tr>
              <th class="px-4 py-3 border-b text-left text-xs font-semibold uppercase tracking-wider w-8" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')"></th>
              @for(col of visibleColumns(); track col.id) {
                <th class="px-4 py-3 border-b text-left text-xs font-semibold uppercase tracking-wider" [class]="themeService.c('border-primary') + ' ' + themeService.c('text-secondary')">{{col.label}}</th>
              }
              <th class="px-4 py-3 border-b" [class]="themeService.c('border-primary')"></th>
            </tr>
          </thead>
            <tbody class="divide-y" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
              @for (task of paginatedTasks(); track task.id) {
                <tr class="cursor-pointer" [class]="themeService.c('bg-primary-hover')" (click)="uiService.openTaskModal(task)">
                  <td class="px-4 py-3 text-sm">
                    <input type="checkbox" [checked]="task.completed" (change)="toggleCompleted(task.id)" (click)="$event.stopPropagation()" class="h-4 w-4 rounded" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-accent') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent')">
                  </td>
                  @if (isColumnVisible('title')) {
                    <td class="px-4 py-3 text-sm font-medium" [class.line-through]="task.completed" [class]="task.completed ? themeService.c('text-secondary') : themeService.c('text-primary')">{{task.title}}</td>
                  }
                  @if (isColumnVisible('dueDate')) {
                    <td class="px-4 py-3 text-sm" [class.line-through]="task.completed" [class]="task.completed ? themeService.c('text-secondary') : themeService.c('text-base')">{{task.dueDate | date:'mediumDate'}}</td>
                  }
                  @if (isColumnVisible('owner')) {
                    <td class="px-4 py-3 text-sm" [class.line-through]="task.completed" [class]="task.completed ? themeService.c('text-secondary') : themeService.c('text-base')">{{ dataService.getUserById(task.ownerId)?.name }}</td>
                  }
                   @if (isColumnVisible('relatedEntity')) {
                    <td class="px-4 py-3 text-sm" [class.line-through]="task.completed" [class]="task.completed ? themeService.c('text-secondary') : themeService.c('text-base')">{{ task.relatedEntity ? dataService.getRelatedEntityName(task.relatedEntity) : 'N/A' }}</td>
                  }
                  @if (isColumnVisible('status')) {
                    <td class="px-4 py-3 text-sm">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="task.completed ? themeService.c('bg-success-subtle') + ' ' + themeService.c('text-success') : themeService.c('bg-warning-subtle') + ' ' + themeService.c('text-warning')">
                            {{ task.completed ? 'Completed' : 'Pending' }}
                        </span>
                    </td>
                  }
                  <td class="px-4 py-3 text-sm text-right">
                    <button (click)="$event.stopPropagation(); delete(task.id)" class="font-medium" [class]="themeService.c('text-danger') + ' ' + themeService.c('hover:text-danger-hover')">Delete</button>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td [attr.colspan]="visibleColumns().length + 2" class="text-center py-8" [class]="themeService.c('text-secondary')">No tasks found.</td>
                </tr>
              }
            </tbody>
        </table>
      </div>

       <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredTasks().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 border-t rounded-b-lg" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm" [class]="themeService.c('text-base')">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredTasks().length }}</span>
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
export class TasksComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  isTaskManagementEnabled = this.authService.isFeatureEnabled('taskManagement');

  searchTerm = signal('');
  statusFilter = signal<'all' | 'pending' | 'completed'>('all');

  constructor() {
    effect(() => {
      // When filters change, reset pagination
      this.searchTerm();
      this.statusFilter();
      this.uiService.setCurrentPage('tasks', 1);
    });
  }

  columns = computed(() => this.uiService.tableColumnConfigs().tasks);
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
  
  private visibleTasks = computed(() => {
    const userIds = this.getVisibleUserIds();
    return this.dataService.tasks().filter(t => userIds.includes(t.ownerId));
  });

  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();

    return this.visibleTasks().filter(task => {
      const termMatch = task.title.toLowerCase().includes(term);
      const statusMatch = status === 'all' || 
                          (status === 'completed' && task.completed) ||
                          (status === 'pending' && !task.completed);
      return termMatch && statusMatch;
    });
  });

  // Pagination signals
  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['tasks'] || 1);
  totalPages = computed(() => {
    const total = this.filteredTasks().length;
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedTasks = computed(() => {
    const allTasks = this.filteredTasks();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allTasks.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredTasks().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredTasks().length);
  });

  // Methods to handle pagination changes
  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('tasks', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }
  
  openAddTaskModal() {
    if (!this.isTaskManagementEnabled()) {
        this.uiService.openUpgradeModal("Task management is not available on your current plan. Please upgrade.");
        return;
    }
    this.uiService.openTaskModal(null);
  }

  toggleCompleted(taskId: string) {
    this.dataService.toggleTaskCompleted(taskId);
  }

  delete(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
        this.dataService.deleteTask(taskId);
    }
  }
}
