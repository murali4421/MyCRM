import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-user-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeUserModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-lg" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'Invite User' : 'Edit User' }}</h2>
            <button (click)="uiService.closeUserModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6">
           <form #userForm="ngForm" (ngSubmit)="saveUser(userForm)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Full Name</label>
                  <input type="text" name="name" [ngModel]="userModel()?.name" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                </div>
                 <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Email</label>
                  <input type="email" name="email" [ngModel]="userModel()?.email" required email class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                </div>
                <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Role</label>
                  <select name="roleId" [ngModel]="userModel()?.roleId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                      @for(role of dataService.roles(); track role.id) {
                          <option [value]="role.id">{{role.name}}</option>
                      }
                  </select>
                </div>
                 @if(!isNew) {
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Status</label>
                        <select name="status" [ngModel]="userModel()?.status" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                           <option>Active</option>
                           <option>Inactive</option>
                        </select>
                    </div>
                 }
              </div>
              <div class="mt-8 pt-4 border-t flex justify-end gap-2" [class]="themeService.c('border-primary')">
                <button type="button" (click)="uiService.closeUserModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="userForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">{{ isNew ? 'Send Invite' : 'Save Changes' }}</button>
              </div>
           </form>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  themeService = inject(ThemeService);

  isNew = false;
  userModel = signal<Partial<User>>({});

  constructor() {
    effect(() => {
        const editingUser = this.uiService.editingUser();
        untracked(() => {
            if (editingUser && editingUser.id) {
                this.isNew = false;
                this.userModel.set({ ...editingUser });
            } else {
                this.isNew = true;
                this.userModel.set({ 
                    roleId: 'role-3' // Default to Sales Rep
                });
            }
        });
    });
  }

  async saveUser(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.userModel(), ...form.value };

    if (this.isNew) {
      const newUser: User = {
        ...formData,
        id: `user-${Date.now()}`,
        status: 'Invited',
        profilePictureUrl: `https://i.pravatar.cc/150?u=${Date.now()}`
      } as User;
      await this.dataService.addUser(newUser);
    } else {
      await this.dataService.updateUser(formData as User);
    }
    this.uiService.closeUserModal();
  }
}
