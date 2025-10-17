import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Tasks</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search tasks..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto order-first sm:order-none">
            <button (click)="uiService.openImportModal('tasks')" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Import</button>
            <button (click)="uiService.openTaskModal(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">New Task</button>
          </div>
      </div>

      <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <ul class="divide-y divide-gray-700">
          @for (task of paginatedTasks(); track task.id) {
            <li class="p-4 flex items-center space-x-4">
              <input type="checkbox" [checked]="task.completed" (change)="dataService.toggleTaskCompleted(task.id)" class="h-5 w-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 cursor-pointer">
              <div class="flex-1">
                  <p class="font-medium text-gray-100" [class.line-through]="task.completed">{{ task.title }}</p>
                  <div class="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <span>Due: {{ task.dueDate | date:'mediumDate' }}</span>
                      <span>Owner: {{ dataService.getUserById(task.ownerId)?.name }}</span>
                      @if(task.relatedEntity) {
                        <span>Related To: {{ dataService.getRelatedEntityName(task.relatedEntity) }}</span>
                      }
                      @if(task.dependsOnTaskId) {
                        <span>Blocks: {{ getParentTaskTitle(task.dependsOnTaskId) }}</span>
                      }
                  </div>
              </div>
              <button (click)="uiService.openTaskModal(task)" class="text-indigo-400 hover:text-indigo-300 font-medium text-sm">Edit</button>
              <button (click)="deleteTask(task.id)" class="text-red-500 hover:text-red-400 font-medium text-sm">Delete</button>
            </li>
          }
          @empty {
             <li class="text-center py-8 text-gray-400">No tasks found.</li>
          }
        </ul>
      </div>

       <!-- Pagination Controls -->
      @if (totalPages() > 0 && filteredTasks().length > 0) {
        <div class="flex items-center justify-between py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm text-gray-300">
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
export class TasksComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  searchTerm = signal('');

  constructor() {
    effect(() => {
      this.searchTerm();
      this.uiService.setCurrentPage('tasks', 1);
    });
  }

  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const allRoles = this.dataService.roles();

    if (!currentUser || !currentUser.roleId || !allRoles.length) {
      return [];
    }
    
    const userRole = allRoles.find(r => r.id === currentUser.roleId);

    if (!userRole || !userRole.name) {
      return [];
    }
  
    if (userRole.name === 'Admin') {
      return this.dataService.users().map(u => u.id);
    }
    
    if (userRole.name === 'Manager') {
      const teamMemberIds = this.dataService.users().filter(u => u.managerId === currentUser.id).map(u => u.id);
      return [currentUser.id, ...teamMemberIds];
    }
    
    return [currentUser.id]; // Sales Rep
  });

  visibleTasks = computed(() => this.dataService.tasks().filter(t => this.getVisibleUserIds().includes(t.ownerId)));
  
  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.visibleTasks().filter(task => 
      task.title.toLowerCase().includes(term)
    );
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

  async deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      await this.dataService.deleteTask(taskId);
    }
  }

  getParentTaskTitle(taskId: string | null | undefined): string | undefined {
    if (!taskId) return undefined;
    return this.dataService.tasks().find(t => t.id === taskId)?.title;
  }
}
