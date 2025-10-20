import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Project } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-project-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeProjectModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-xl z-50 flex flex-col" [class]="themeService.c('bg-primary')">
      <header class="p-4 border-b flex justify-between items-center flex-shrink-0" [class]="themeService.c('border-primary')">
        <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Project' : 'Project Details' }}</h2>
        <button (click)="uiService.closeProjectModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
          <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <form #projectForm="ngForm" (ngSubmit)="saveProject(projectForm)" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Project Name</label>
                <input type="text" name="name" [ngModel]="projectModel()?.name" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>
              
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Company</label>
                <select name="companyId" [ngModel]="projectModel()?.companyId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    <option value="" disabled>Select a company</option>
                    @for(company of dataService.companies(); track company.id) {
                        <option [value]="company.id">{{company.name}}</option>
                    }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Status</label>
                <select name="status" [ngModel]="projectModel()?.status" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    @for(status of projectStatuses; track status) {
                        <option [value]="status">{{status}}</option>
                    }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Budget (USD)</label>
                <input type="number" name="budget" [ngModel]="projectModel()?.budget" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
              </div>
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Owner</label>
                <select name="ownerId" [ngModel]="projectModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Start Date</label>
                <input type="date" name="startDate" [ngModel]="projectModel()?.startDate" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
              </div>
              <div>
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">End Date</label>
                <input type="date" name="endDate" [ngModel]="projectModel()?.endDate" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Description</label>
                <textarea name="description" [ngModel]="projectModel()?.description" rows="4" class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')"></textarea>
              </div>
            </div>
        </div>
        <footer class="p-4 flex-shrink-0" [class]="themeService.c('bg-base') + ' border-t ' + themeService.c('border-primary')">
            <div class="flex justify-end gap-2">
                <button type="button" (click)="uiService.closeProjectModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="projectForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Save Project</button>
                @if(!isNew) {
                <button type="button" (click)="deleteProject()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-danger-subtle') + ' ' + themeService.c('border-danger-subtle') + ' ' + themeService.c('text-danger') + ' ' + themeService.c('hover:bg-danger-subtle-hover')">Delete</button>
                }
            </div>
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
  themeService = inject(ThemeService);

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
