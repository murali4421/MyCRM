import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Task } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-task-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeTaskModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-lg" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Task' : 'Edit Task' }}</h2>
            <button (click)="uiService.closeTaskModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6">
           <form #taskForm="ngForm" (ngSubmit)="saveTask(taskForm)">
              <div class="space-y-4">
                 <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Title</label>
                    <input type="text" name="title" [ngModel]="taskModel()?.title" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                  </div>
                  <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Due Date</label>
                    <input type="date" name="dueDate" [ngModel]="taskModel()?.dueDate" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                  </div>
                  <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Owner</label>
                    <select name="ownerId" [ngModel]="taskModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                        @for(user of dataService.users(); track user.id) {
                            <option [value]="user.id">{{user.name}}</option>
                        }
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Related To</label>
                    <div class="mt-1 flex gap-2">
                        <select name="relatedEntityType" [ngModel]="taskModel().relatedEntity?.type ?? 'none'" (ngModelChange)="onEntityTypeChange(taskForm, $event)" class="block w-1/3 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                            <option value="none">-- None --</option>
                            <option value="contact">Contact</option>
                            <option value="company">Company</option>
                            <option value="opportunity">Opportunity</option>
                        </select>
                        @if (relatedEntityType() !== 'none') {
                            <select name="relatedEntityId" [ngModel]="taskModel().relatedEntity?.id" class="block w-2/3 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                                <option [ngValue]="undefined" disabled>Select {{ relatedEntityType() }}</option>
                                @switch (relatedEntityType()) {
                                    @case ('contact') {
                                        @for(contact of dataService.contacts(); track contact.id) { <option [value]="contact.id">{{ contact.name }}</option> }
                                    }
                                    @case ('company') {
                                        @for(company of dataService.companies(); track company.id) { <option [value]="company.id">{{ company.name }}</option> }
                                    }
                                    @case ('opportunity') {
                                        @for(opp of dataService.opportunities(); track opp.id) { <option [value]="opp.id">{{ opp.name }}</option> }
                                    }
                                }
                            </select>
                        }
                    </div>
                  </div>
                  
                   <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Depends On (Blocks)</label>
                    <select name="dependsOnTaskId" [ngModel]="taskModel()?.dependsOnTaskId" class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                        <option [ngValue]="null">-- None --</option>
                        @for(task of availableParentTasks(); track task.id) {
                            <option [value]="task.id">{{task.title}}</option>
                        }
                    </select>
                  </div>

              </div>
              <div class="mt-8 pt-4 border-t flex justify-end gap-2" [class]="themeService.c('border-primary')">
                <button type="button" (click)="uiService.closeTaskModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="taskForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Save Task</button>
              </div>
           </form>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  isNew = false;
  taskModel = signal<Partial<Task>>({});
  relatedEntityType = signal<'contact' | 'company' | 'opportunity' | 'none'>('none');

  constructor() {
     effect(() => {
        const editingTask = this.uiService.editingTask();
        untracked(() => {
            if (editingTask && editingTask.id) {
                this.isNew = false;
                this.taskModel.set({ ...editingTask });
            } else {
                this.isNew = true;
                this.taskModel.set({ 
                    ...editingTask, // can have pre-filled data like relatedEntity
                    ownerId: this.authService.currentUser()?.id,
                    dueDate: new Date().toISOString().split('T')[0],
                    completed: false
                });
            }
            this.relatedEntityType.set(this.taskModel().relatedEntity?.type ?? 'none');
        });
    });
  }

  availableParentTasks = computed(() => {
    const currentTaskId = this.taskModel().id;
    return this.dataService.tasks().filter(t => t.id !== currentTaskId);
  });
  
  onEntityTypeChange(form: NgForm, newType: 'contact' | 'company' | 'opportunity' | 'none') {
    this.relatedEntityType.set(newType);
    // Reset the second dropdown when the first one changes
    if (form.controls['relatedEntityId']) {
      form.controls['relatedEntityId'].reset();
    }
  }

  async saveTask(form: NgForm) {
    if (form.invalid) return;

    const { relatedEntityType, relatedEntityId, ...taskData } = form.value;
    
    const finalTaskData = { 
        ...this.taskModel(), // get base properties like id, completed status
        ...taskData 
    };
    
    if (relatedEntityType !== 'none' && relatedEntityId) {
        finalTaskData.relatedEntity = { type: relatedEntityType, id: relatedEntityId };
    } else {
        finalTaskData.relatedEntity = undefined;
    }

    if (this.isNew) {
      const newTask: Task = {
        ...finalTaskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Task;
      await this.dataService.addTask(newTask);
    } else {
      await this.dataService.updateTask(finalTaskData as Task);
    }
    this.uiService.closeTaskModal();
  }
}
