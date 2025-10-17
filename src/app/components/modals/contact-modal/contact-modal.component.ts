import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Contact } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-contact-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeContactModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-xl bg-gray-800 z-50 flex flex-col">
       <header class="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Contact' : 'Contact Details' }}</h2>
        <button (click)="uiService.closeContactModal()" class="p-2 rounded-full hover:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-6">
        <form #contactForm="ngForm" (ngSubmit)="saveContact(contactForm)">
           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300">Full Name</label>
                <input type="text" name="name" [ngModel]="contactModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Email</label>
                <input type="email" name="email" [ngModel]="contactModel()?.email" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Phone</label>
                <input type="text" name="phone" [ngModel]="contactModel()?.phone" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Role in Company</label>
                <input type="text" name="roleInCompany" [ngModel]="contactModel()?.roleInCompany" class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300">Company</label>
                <select name="companyId" [ngModel]="contactModel()?.companyId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="" disabled>Select a company</option>
                    @for(company of dataService.companies(); track company.id) {
                        <option [value]="company.id">{{company.name}}</option>
                    }
                </select>
              </div>
               <div>
                <label class="block text-sm font-medium text-gray-300">Owner</label>
                <select name="ownerId" [ngModel]="contactModel()?.ownerId" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    @for(user of dataService.users(); track user.id) {
                        <option [value]="user.id">{{user.name}}</option>
                    }
                </select>
              </div>
           </div>
           <div class="mt-8 pt-4 border-t border-gray-700 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeContactModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" [disabled]="contactForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Contact</button>
                 @if(!isNew) {
                  <button type="button" (click)="deleteContact()" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 text-sm font-medium">Delete</button>
                 }
           </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  isNew = false;
  contactModel = signal<Partial<Contact>>({});

  constructor() {
     effect(() => {
        const selectedContact = this.uiService.selectedContact();
        untracked(() => {
            if (selectedContact) {
                this.isNew = false;
                this.contactModel.set({ ...selectedContact });
            } else {
                this.isNew = true;
                this.contactModel.set({ ownerId: this.authService.currentUser()?.id });
            }
        });
    });
  }

  saveContact(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.contactModel(), ...form.value };

    if (this.isNew) {
      const newContact: Contact = {
        ...formData,
        id: `cont-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this.dataService.addContact(newContact);
    } else {
      this.dataService.updateContact(formData as Contact);
    }
    this.uiService.closeContactModal();
  }
  
  deleteContact() {
    if(this.contactModel()?.id && confirm('Are you sure you want to delete this contact?')) {
        this.dataService.deleteContact(this.contactModel().id!);
        this.uiService.closeContactModal();
    }
  }
}