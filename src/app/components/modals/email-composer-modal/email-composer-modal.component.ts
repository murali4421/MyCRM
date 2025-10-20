import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { Activity, RelatedEntity } from '../../../models/crm.models';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-email-composer-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeEmailComposer()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-4xl" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">Compose Email</h2>
            <button (click)="uiService.closeEmailComposer()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6 max-h-[80vh] overflow-y-auto">
           <form #emailForm="ngForm" (ngSubmit)="sendEmail(emailForm)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">To</label>
                  <input type="email" name="to" [(ngModel)]="composerData().to" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                </div>
                 <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Subject</label>
                  <input type="text" name="subject" [(ngModel)]="composerData().subject" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                </div>
                 <div>
                    <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Template</label>
                    <select (change)="applyTemplate($any($event.target).value)" class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                        <option value="">-- No Template --</option>
                        @for(template of dataService.emailTemplates(); track template.id) {
                            <option [value]="template.id">{{template.name}}</option>
                        }
                    </select>
                </div>
                <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Related To</label>
                  <div class="mt-1 flex gap-2">
                    <select name="relatedEntityType" [ngModel]="relatedEntityType()" (ngModelChange)="onEntityTypeChange($event)" class="block w-1/3 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                      <option value="none">-- None --</option>
                      <option value="contact">Contact</option>
                      <option value="company">Company</option>
                      <option value="opportunity">Opportunity</option>
                      <option value="task">Task</option>
                    </select>
                    @if (relatedEntityType() !== 'none') {
                      <select name="relatedEntityId" [ngModel]="relatedEntityId()" (ngModelChange)="relatedEntityId.set($event)" class="block w-2/3 pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                        <option [ngValue]="undefined" disabled>Select {{ relatedEntityType() | titlecase }}</option>
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
                          @case ('task') {
                            @for(task of dataService.tasks(); track task.id) { <option [value]="task.id">{{ task.title }}</option> }
                          }
                        }
                      </select>
                    }
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Body</label>
                        <textarea name="body" [(ngModel)]="composerData().body" rows="12" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 font-mono" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Preview</label>
                        <div class="mt-1 p-3 border rounded-md min-h-[250px] text-sm" [class]="themeService.c('bg-base') + ' ' + themeService.c('border-primary') + ' ' + themeService.c('text-primary')">
                            <div class="pb-2 mb-2 space-y-1" [class]="'border-b ' + themeService.c('border-primary')">
                                <p><span class="font-semibold" [class]="themeService.c('text-secondary')">To:</span> {{ composerData().to }}</p>
                                <p><span class="font-semibold" [class]="themeService.c('text-secondary')">Subject:</span> {{ composerData().subject }}</p>
                            </div>
                            <div [innerHTML]="previewHtml()"></div>
                        </div>
                    </div>
                </div>
              </div>
              <div class="mt-8 pt-4 border-t flex justify-end gap-2" [class]="themeService.c('border-primary')">
                <button type="button" (click)="uiService.closeEmailComposer()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="emailForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Send & Log</button>
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
  themeService = inject(ThemeService);

  composerData = this.uiService.emailComposerData;
  relatedEntityType = signal<'contact' | 'company' | 'opportunity' | 'task' | 'none'>('none');
  relatedEntityId = signal<string | undefined>(undefined);

  constructor() {
    effect(() => {
      const data = this.uiService.emailComposerData();
      untracked(() => {
        if (data.relatedEntity) {
          this.relatedEntityType.set(data.relatedEntity.type);
          this.relatedEntityId.set(data.relatedEntity.id);
        } else {
          this.relatedEntityType.set('none');
          this.relatedEntityId.set(undefined);
        }
      });
    });
  }

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

  onEntityTypeChange(newType: 'contact' | 'company' | 'opportunity' | 'task' | 'none') {
    this.relatedEntityType.set(newType);
    this.relatedEntityId.set(undefined);
  }

  async sendEmail(form: NgForm) {
    if (form.invalid) return;

    let finalRelatedEntity: RelatedEntity | undefined = undefined;
    const entityType = this.relatedEntityType();
    const entityId = this.relatedEntityId();

    if (entityType !== 'none' && entityId) {
      finalRelatedEntity = { type: entityType, id: entityId };
    }

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
      relatedEntity: finalRelatedEntity,
    };

    await this.dataService.addActivity(newActivity);
    alert('Email sent (and logged as activity).');
    this.uiService.closeEmailComposer();
  }
}
