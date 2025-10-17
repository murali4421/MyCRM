import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { Activity } from '../../../models/crm.models';

@Component({
  selector: 'app-email-composer-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeEmailComposer()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-100">Compose Email</h2>
            <button (click)="uiService.closeEmailComposer()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6 max-h-[80vh] overflow-y-auto">
           <form #emailForm="ngForm" (ngSubmit)="sendEmail(emailForm)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300">To</label>
                  <input type="email" name="to" [(ngModel)]="composerData().to" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
                 <div>
                  <label class="block text-sm font-medium text-gray-300">Subject</label>
                  <input type="text" name="subject" [(ngModel)]="composerData().subject" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
                 <div>
                    <label class="block text-sm font-medium text-gray-300">Template</label>
                    <select (change)="applyTemplate($any($event.target).value)" class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">-- No Template --</option>
                        @for(template of dataService.emailTemplates(); track template.id) {
                            <option [value]="template.id">{{template.name}}</option>
                        }
                    </select>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Body</label>
                        <textarea name="body" [(ngModel)]="composerData().body" rows="12" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Preview</label>
                        <div class="mt-1 p-3 border border-gray-700 rounded-md bg-gray-900 min-h-[250px] text-sm text-gray-200">
                            <div class="pb-2 mb-2 border-b border-gray-700 space-y-1">
                                <p><span class="font-semibold text-gray-400">To:</span> {{ composerData().to }}</p>
                                <p><span class="font-semibold text-gray-400">Subject:</span> {{ composerData().subject }}</p>
                            </div>
                            <div [innerHTML]="previewHtml()"></div>
                        </div>
                    </div>
                </div>
              </div>
              <div class="mt-8 pt-4 border-t border-gray-700 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeEmailComposer()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" [disabled]="emailForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Send & Log</button>
              </div>
           </form>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailComposerModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);

  composerData = this.uiService.emailComposerData;

  previewHtml = computed(() => {
    const body = this.composerData().body;
    // Basic formatting: replace newlines with <br> tags for HTML preview
    return body.replace(/\n/g, '<br>');
  });

  applyTemplate(templateId: string) {
    if (!templateId) {
        this.composerData.update(d => ({ ...d, subject: '', body: '' }));
        return;
    }
    const template = this.dataService.emailTemplates().find(t => t.id === templateId);
    if (template) {
        // Basic placeholder replacement
        const owner = this.authService.currentUser();
        let contact;
        const relatedEntity = this.composerData().relatedEntity;
        if (relatedEntity?.type === 'contact') {
            contact = this.dataService.contacts().find(c => c.id === relatedEntity.id);
        }

        let body = template.body;
        let subject = template.subject;
        if (owner) {
            body = body.replace(/{{owner.name}}/g, owner.name);
            subject = subject.replace(/{{owner.name}}/g, owner.name);
        }
        if (contact) {
            body = body.replace(/{{contact.name}}/g, contact.name);
            subject = subject.replace(/{{contact.name}}/g, contact.name);
            const company = this.dataService.getCompanyById(contact.companyId);
            if (company) {
                body = body.replace(/{{company.name}}/g, company.name);
            }
        }

        this.composerData.update(d => ({ ...d, subject: subject, body: body }));
    }
  }

  async sendEmail(form: NgForm) {
    if (form.invalid) return;

    // In a real app, this would send an email. Here, we just log it as an activity.
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: 'Email',
      subject: form.value.subject,
      description: form.value.body,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'Done',
      ownerId: this.authService.currentUser()!.id,
      relatedEntity: this.composerData().relatedEntity || undefined,
    };

    await this.dataService.addActivity(newActivity);
    alert('Email sent (and logged as activity).');
    this.uiService.closeEmailComposer();
  }
}
