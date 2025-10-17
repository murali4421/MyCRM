import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Task } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-task-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeTaskModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Task' : 'Edit Task' }}</h2>
            <button (click)="uiService.closeTaskModal()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6">
           <form #taskForm="ngForm" (ngSubmit)="saveTask(taskForm)">
              <div class="space-y-4">
                 <div>
                    <label class="block text-sm font-medium text-gray-300">Title</label>
                    <input type="text" name="title" [ngModel]="taskModel()?.title" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300">Due Date</label>
                    <input type="date" name="dueDate" [ngModel]="taskModel()?.dueDate" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300">Owner</label>
                    <select name="ownerId" [ngModel]="taskModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        @for(user of dataService.users(); track user.id) {
                            <option [value]="user.id">{{user.name}}</option>
                        }
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300">Related To</label>
                    <div class="mt-1 flex gap-2">
                        <select name="relatedEntityType" [ngModel]="taskModel().relatedEntity?.type ?? 'none'" (ngModelChange)="onEntityTypeChange(taskForm, $event)" class="block w-1/3 pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="none">-- None --</option>
                            <option value="contact">Contact</option>
                            <option value="company">Company</option>
                            <option value="opportunity">Opportunity</option>
                        </select>
                        @if (relatedEntityType() !== 'none') {
                            <select name="relatedEntityId" [ngModel]="taskModel().relatedEntity?.id" class="block w-2/3 pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
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
                    <label class="block text-sm font-medium text-gray-300">Depends On (Blocks)</label>
                    <select name="dependsOnTaskId" [ngModel]="taskModel()?.dependsOnTaskId" class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option [ngValue]="null">-- None --</option>
                        @for(task of availableParentTasks(); track task.id) {
                            <option [value]="task.id">{{task.title}}</option>
                        }
                    </select>
                  </div>

              </div>
              <div class="mt-8 pt-4 border-t border-gray-700 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeTaskModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" [disabled]="taskForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Task</button>
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
