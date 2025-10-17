import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Project } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-project-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeProjectModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-xl bg-gray-800 z-50 flex flex-col">
      <header class="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Project' : 'Project Details' }}</h2>
        <button (click)="uiService.closeProjectModal()" class="p-2 rounded-full hover:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <form #projectForm="ngForm" (ngSubmit)="saveProject(projectForm)" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Project Name</label>
                <input type="text" name="name" [ngModel]="projectModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300">Company</label>
                <select name="companyId" [ngModel]="projectModel()?.companyId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="" disabled>Select a company</option>
                    @for(company of dataService.companies(); track company.id) {
                        <option [value]="company.id">{{company.name}}</option>
                    }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Status</label>
                <select name="status" [ngModel]="projectModel()?.status" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    @for(status of projectStatuses; track status) {
                        <option [value]="status">{{status}}</option>
                    }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Budget (USD)</label>
                <input type="number" name="budget" [ngModel]="projectModel()?.budget" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Owner</label>
                <select name="ownerId" [ngModel]="projectModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Start Date</label>
                <input type="date" name="startDate" [ngModel]="projectModel()?.startDate" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">End Date</label>
                <input type="date" name="endDate" [ngModel]="projectModel()?.endDate" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300">Description</label>
                <textarea name="description" [ngModel]="projectModel()?.description" rows="4" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm"></textarea>
              </div>
            </div>
        </div>
        <footer class="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2 flex-shrink-0">
          <button type="button" (click)="uiService.closeProjectModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
          <button type="submit" [disabled]="projectForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Project</button>
            @if(!isNew) {
            <button type="button" (click)="deleteProject()" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 text-sm font-medium">Delete</button>
            }
        </footer>
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  isNew = false;
  projectModel = signal<Partial<Project>>({});
  projectStatuses: Project['status'][] = ['Planning', 'In Progress', 'Completed', 'On Hold'];

  constructor() {
    effect(() => {
        const selectedProject = this.uiService.selectedProject();
        untracked(() => {
            if (selectedProject === undefined) return;
            if (selectedProject === null) {
                this.isNew = true;
                this.projectModel.set({ 
                    ownerId: this.authService.currentUser()?.id,
                    status: 'Planning',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
                });
            } else {
                this.isNew = false;
                this.projectModel.set({ ...selectedProject });
            }
        });
    });
  }
  
  async saveProject(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.projectModel(), ...form.value };

    if (this.isNew) {
      const newProject: Project = {
        ...formData,
        id: `proj-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Project;
      await this.dataService.addProject(newProject);
    } else {
      await this.dataService.updateProject(formData as Project);
    }
    this.uiService.closeProjectModal();
  }
  
  async deleteProject() {
    if(this.projectModel()?.id && confirm('Are you sure you want to delete this project?')) {
        await this.dataService.deleteProject(this.projectModel().id!);
        this.uiService.closeProjectModal();
    }
  }
}
