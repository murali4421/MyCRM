import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';

@Component({
  selector: 'app-user-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeUserModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'Invite User' : 'Edit User' }}</h2>
            <button (click)="uiService.closeUserModal()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6">
           <form #userForm="ngForm" (ngSubmit)="saveUser(userForm)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300">Full Name</label>
                  <input type="text" name="name" [ngModel]="userModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
                 <div>
                  <label class="block text-sm font-medium text-gray-300">Email</label>
                  <input type="email" name="email" [ngModel]="userModel()?.email" required email class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-300">Role</label>
                  <select name="roleId" [ngModel]="userModel()?.roleId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      @for(role of dataService.roles(); track role.id) {
                          <option [value]="role.id">{{role.name}}</option>
                      }
                  </select>
                </div>
                 @if(!isNew) {
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Status</label>
                        <select name="status" [ngModel]="userModel()?.status" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                           <option>Active</option>
                           <option>Inactive</option>
                        </select>
                    </div>
                 }
              </div>
              <div class="mt-8 pt-4 border-t border-gray-700 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeUserModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" [disabled]="userForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">{{ isNew ? 'Send Invite' : 'Save Changes' }}</button>
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
