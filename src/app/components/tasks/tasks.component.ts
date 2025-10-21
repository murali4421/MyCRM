import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('placeholder-text')">
            <button (click)="uiService.openImportModal('tasks')" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Import</button>
            <button 
              (click)="startAdding()" 
              [disabled]="isAdding()"
              [title]="authService.isFeatureEnabled('taskManagement')() ? 'Add a new task' : 'Task management is not available on your plan. Please upgrade.'"
              class="px-4 py-2 rounded-md text-sm font-medium disabled:cursor-not-allowed"
              [class.cursor-not-allowed]="!authService.isFeatureEnabled('taskManagement')()"
              [class]="(authService.isFeatureEnabled('taskManagement')() ? themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') : themeService.c('bg-disabled')) + ' ' + themeService.c('text-on-accent')">
              Add Task
            </button>
          </div>
      </div>

      @if (isAdding()) {
        <div class="rounded-lg shadow-sm border p-4 mb-4" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <form #newTaskForm="ngForm" (ngSubmit)="saveNewTask(newTaskForm)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Title</label>
                <input type="text" name="title" ngModel required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Due Date</label>
                <input type="date" name="dueDate" [ngModel]="newTask.dueDate" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Owner</label>
                <select name="ownerId" [ngModel]="newTask.ownerId" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                  @for(user of dataService.users(); track user.id) {
                    <option [value]="user.id">{{user.name}}</option>
                  }
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-4 pt-4 border-t" [class]="themeService.c('border-primary')">
              <button type="button" (click)="cancelAdd()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
              <button type="submit" [disabled]="!newTaskForm.valid" class="px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled') + ' ' + themeService.c('text-on-accent')">Save Task</button>
            </div>
          </form>
        </div>
      }

      <div class="rounded-lg shadow-sm border" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
        <ul class="divide-y" [class]="themeService.c('border-primary')">
          @for (task of paginatedTasks(); track task.id) {
            <li class="p-4 flex items-center space-x-4 cursor-pointer" [class]="themeService.c('bg-primary-hover')" (click)="uiService.openTaskModal(task)">
              <input type="checkbox" [checked]="task.completed" (change)="dataService.toggleTaskCompleted(task.id)" (click)="$event.stopPropagation()" class="h-5 w-5 rounded cursor-pointer" [class]="themeService.c('text-accent') + ' ' + themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent')">
              <div class="flex-1">
                  <p class="font-medium" [class]="themeService.c('text-primary') + (task.completed ? ' line-through' : '')">{{ task.title }}</p>
                  <div class="flex items-center space-x-4 text-sm mt-1" [class]="themeService.c('text-secondary')">
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
              <button (click)="$event.stopPropagation(); deleteTask(task.id)" class="font-medium text-sm" [class]="themeService.c('text-danger') + ' ' + themeService.c('hover:text-danger-hover')">Delete</button>
            </li>
          }
          @empty {
            @if (!isAdding()) {
              <li class="text-center py-8" [class]="themeService.c('text-secondary')">No tasks found.</li>
            }
          }
        </ul>
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

  searchTerm = signal('');
  isAdding = signal(false);
  newTask: Partial<Task> = {};

  constructor() {
    effect(() => {
      this.searchTerm();
      this.uiService.setCurrentPage('tasks', 1);
    });
  }

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

  startAdding() {
    if (!this.authService.isFeatureEnabled('taskManagement')()) {
        this.uiService.openUpgradeModal("Task Management is not available on your current plan. Please upgrade to add tasks.");
        return;
    }
    this.newTask = {
      ownerId: this.authService.currentUser()?.id,
      dueDate: new Date().toISOString().split('T')[0],
      completed: false
    };
    this.isAdding.set(true);
  }

  cancelAdd() {
    this.isAdding.set(false);
  }

  async saveNewTask(form: NgForm) {
    if (form.invalid) return;
    const taskToAdd: Task = {
      ...form.value,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      completed: false
    };
    await this.dataService.addTask(taskToAdd);
    this.isAdding.set(false);
  }
}