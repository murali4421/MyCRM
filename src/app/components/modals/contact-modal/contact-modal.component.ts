import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Contact, Activity, OpportunityStage } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';

@Component({
  selector: 'app-contact-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeContactModal()"></div>
    <div class="fixed inset-y-0 right-0 w-full max-w-xl bg-gray-800 z-50 flex flex-col">
      <header class="p-4 border-b border-gray-700 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Contact' : 'Contact Details' }}</h2>
          @if (!isNew && contactModel().leadScore) {
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              [class]="getLeadScoreBadgeClass(contactModel().leadScore!)"
            >
              {{ contactModel().leadScore }} Lead
            </span>
             <button type="button" (click)="generateAndSaveLeadScore(contactModel()!)" [disabled]="geminiService.isGeneratingLeadScore()" class="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50" title="Refresh lead score">
                @if(geminiService.isGeneratingLeadScore() && isRescoring()) {
                    <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                }
            </button>
          }
        </div>
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
          
            <!-- AI Assistant -->
            @if(!isNew) {
                <div class="mt-6 pt-6 border-t border-gray-700">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-lg font-semibold text-gray-100 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" /></svg>
                            AI Assistant
                        </h3>
                         <button type="button" (click)="getAiSuggestion()" [disabled]="geminiService.isGeneratingAction()" class="bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-md hover:bg-indigo-500/20 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                            @if (geminiService.isGeneratingAction()) {
                                <span class="flex items-center">
                                    <div class="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Thinking...
                                </span>
                            } @else {
                                <span>Get Next Best Action</span>
                            }
                        </button>
                    </div>
                     @if (aiSuggestion()) {
                      <div class="bg-gray-900 p-4 rounded-md border border-gray-700">
                          <p class="text-sm text-gray-300">{{ aiSuggestion() }}</p>
                      </div>
                    } @else if (!geminiService.isGeneratingAction()) {
                        <p class="text-sm text-gray-400">Click the button to get a suggestion for your next step with this contact.</p>
                    }
                </div>
            }

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
  geminiService = inject(GeminiService);

  isNew = false;
  isRescoring = signal(false);
  contactModel = signal<Partial<Contact>>({});
  aiSuggestion = signal<string | null>(null);

  relatedActivities = computed(() => {
    const contactId = this.contactModel()?.id;
    if (!contactId) return [];
    return this.dataService.activities().filter(a => a.relatedEntity?.type === 'contact' && a.relatedEntity.id === contactId);
  });

  constructor() {
    effect(() => {
      const selectedContact = this.uiService.selectedContact();
      untracked(() => {
        // This logic ensures we differentiate between 'undefined' (closed), 'null' (new), and a Contact object (edit).
        if (selectedContact === undefined) {
          // Modal is closed, do nothing.
          return;
        }

        if (selectedContact === null) {
          // New contact mode
          this.isNew = true;
          this.contactModel.set({ ownerId: this.authService.currentUser()?.id });
        } else {
          // Edit contact mode
          this.isNew = false;
          this.contactModel.set({ ...selectedContact });
        }
        // Reset AI suggestion whenever the modal opens or its data changes.
        this.aiSuggestion.set(null);
        this.isRescoring.set(false);
      });
    });
  }

  async getAiSuggestion() {
    const contact = this.contactModel();
    if (!contact || !contact.id) return;

    this.aiSuggestion.set(null); // Clear previous suggestion
    const suggestion = await this.geminiService.generateNextBestActionForContact(contact as Contact, this.relatedActivities());
    this.aiSuggestion.set(suggestion);
  }

  async saveContact(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.contactModel(), ...form.value };

    let savedContact: Contact;

    if (this.isNew) {
      const newContact: Contact = {
        ...formData,
        id: `cont-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      await this.dataService.addContact(newContact);
      savedContact = newContact;
      // Generate score in the background for new contacts
      this.generateAndSaveLeadScore(savedContact);
    } else {
      await this.dataService.updateContact(formData as Contact);
      savedContact = formData as Contact;
    }
    this.uiService.closeContactModal();
  }

  async generateAndSaveLeadScore(contact: Partial<Contact>) {
    if (!contact || !contact.id) return;
    this.isRescoring.set(true);
    const company = this.dataService.getCompanyById(contact.companyId);
    const score = await this.geminiService.generateLeadScore(contact as Contact, company);
    if (score) {
      await this.dataService.updateContact({ ...contact, leadScore: score } as Contact);
    }
    this.isRescoring.set(false);
  }
  
  async deleteContact() {
    const contactId = this.contactModel()?.id;
    if (!contactId) return;

    // Check for associated records
    const associatedTasks = this.dataService.tasks().filter(t => t.relatedEntity?.type === 'contact' && t.relatedEntity.id === contactId);
    const associatedActivities = this.dataService.activities().filter(a => (a.relatedEntity?.type === 'contact' && a.relatedEntity.id === contactId) || a.participants?.includes(contactId));
    const associatedOpportunities = this.dataService.opportunities().filter(o => o.stage !== OpportunityStage.ClosedWon && o.stage !== OpportunityStage.ClosedLost).filter(o => {
        const companyContacts = this.dataService.contacts().filter(c => c.companyId === o.companyId);
        return companyContacts.some(c => c.id === contactId);
    });

    const hasAssociations = associatedTasks.length > 0 || associatedActivities.length > 0 || associatedOpportunities.length > 0;

    if (hasAssociations) {
      let message = `This contact cannot be deleted because it is associated with:\n`;
      if (associatedTasks.length > 0) message += `\n- ${associatedTasks.length} task(s)`;
      if (associatedActivities.length > 0) message += `\n- ${associatedActivities.length} activity(ies)`;
      if (associatedOpportunities.length > 0) message += `\n- ${associatedOpportunities.length} open opportunity(ies)`;
      message += `\n\nPlease reassign or remove these associations first.`;
      
      alert(message);
      return;
    }

    if (confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
        await this.dataService.deleteContact(contactId);
        this.uiService.closeContactModal();
    }
  }

  getLeadScoreBadgeClass(score: 'Hot' | 'Warm' | 'Cold'): string {
    switch (score) {
      case 'Hot': return 'bg-red-500/10 text-red-400';
      case 'Warm': return 'bg-amber-500/10 text-amber-300';
      case 'Cold': return 'bg-sky-500/10 text-sky-300';
      default: return 'bg-gray-500/10 text-gray-300';
    }
  }
}