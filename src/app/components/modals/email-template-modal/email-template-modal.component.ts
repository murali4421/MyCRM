import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { EmailTemplate } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { ThemeService } from '../../../services/theme.service';

declare var Quill: any;

@Component({
  selector: 'app-email-template-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeTemplateEditor()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center flex-shrink-0" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Template' : 'Edit Template' }}</h2>
            <button (click)="uiService.closeTemplateEditor()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6 overflow-y-auto">
           <form #templateForm="ngForm" (ngSubmit)="saveTemplate(templateForm)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Template Name</label>
                  <input type="text" name="name" [ngModel]="templateModel()?.name" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                </div>
                 <div>
                  <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Subject</label>
                  <input type="text" name="subject" [ngModel]="templateModel()?.subject" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                </div>
                <div>
                   <div class="flex justify-between items-center mb-2">
                      <label for="template-body-editor" class="block text-sm font-medium" [class]="themeService.c('text-base')">Body</label>
                      <select #placeholderSelect (change)="insertPlaceholder(placeholderSelect.value); placeholderSelect.value=''" class="text-sm rounded-md py-1 pl-2 pr-8" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                          <option value="" disabled selected>Insert Placeholder...</option>
                          <option [value]="'{{contact.name}}'">Contact Name</option>
                          <option [value]="'{{company.name}}'">Company Name</option>
                          <option [value]="'{{owner.name}}'">Owner Name</option>
                      </select>
                  </div>
                  <!-- Hidden textarea for form validation -->
                  <textarea name="body" [ngModel]="templateModel()?.body" required class="hidden"></textarea>
                  <!-- Quill editor container -->
                  <div #editor id="template-body-editor"></div>
                </div>
              </div>
              <div class="mt-8 pt-4 border-t flex justify-end gap-2" [class]="themeService.c('border-primary')">
                <button type="button" (click)="uiService.closeTemplateEditor()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="templateForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Save Template</button>
              </div>
           </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ql-toolbar {
      background: #374151; /* gray-700 */
      border-color: #4b5563 !important; /* gray-600 */
    }
    :host ::ng-deep .ql-toolbar .ql-stroke {
      stroke: #d1d5db; /* gray-300 */
    }
    :host ::ng-deep .ql-toolbar .ql-fill {
      fill: #d1d5db; /* gray-300 */
    }
    :host ::ng-deep .ql-toolbar .ql-picker-label {
      color: #d1d5db; /* gray-300 */
    }
    :host ::ng-deep .ql-snow .ql-picker.ql-header .ql-picker-label::before,
    :host ::ng-deep .ql-snow .ql-picker.ql-header .ql-picker-item::before {
      color: #d1d5db; /* gray-300 */
    }
    :host ::ng-deep .ql-snow .ql-picker-options {
      background-color: #374151; /* gray-700 */
      border-color: #4b5563 !important; /* gray-600 */
    }
    :host ::ng-deep .ql-snow .ql-picker-item {
      color: #d1d5db; /* gray-300 */
    }
     :host ::ng-deep .ql-snow .ql-picker-item:hover,
     :host ::ng-deep .ql-snow .ql-picker-item.ql-selected {
      background-color: #4b5563; /* gray-600 */
    }
    :host ::ng-deep .ql-container {
      border-color: #4b5563 !important; /* gray-600 */
    }
    :host ::ng-deep .ql-editor {
      min-height: 200px;
      background: #4b5563; /* gray-600 */
      color: #f3f4f6; /* gray-100 */
    }
    :host ::ng-deep .ql-editor.ql-blank::before {
      color: #9ca3af; /* gray-400 */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateModalComponent implements AfterViewInit {
  dataService = inject(DataService);
  uiService = inject(UiService);
  themeService = inject(ThemeService);

  isNew = false;
  templateModel = signal<Partial<EmailTemplate>>({});
  
  editorEl = viewChild<ElementRef>('editor');
  private quill: any;

  constructor() {
    effect(() => {
        const editingTemplate = this.uiService.editingTemplate();
        untracked(() => {
            if (editingTemplate) {
                this.isNew = false;
                this.templateModel.set({ ...editingTemplate });
            } else {
                this.isNew = true;
                this.templateModel.set({});
            }
        });
    });
  }

  ngAfterViewInit(): void {
    if (this.editorEl()) {
      this.quill = new Quill(this.editorEl()!.nativeElement, {
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            ['link'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
          ]
        },
        theme: 'snow',
        placeholder: 'Compose your email template...'
      });

      if (this.templateModel().body) {
        this.quill.root.innerHTML = this.templateModel().body!;
      }

      this.quill.on('text-change', () => {
        const bodyContent = this.quill.root.innerHTML;
        const isEffectivelyEmpty = bodyContent === '<p><br></p>';
        this.templateModel.update(m => ({ ...m, body: isEffectivelyEmpty ? '' : bodyContent }));
      });
    }
  }

  insertPlaceholder(value: string) {
    if (this.quill && value) {
      const range = this.quill.getSelection(true);
      this.quill.insertText(range.index, ` ${value} `, 'user');
      this.quill.setSelection(range.index + value.length + 2);
    }
  }

  async saveTemplate(form: NgForm) {
    if (form.invalid) return;
    
    const formData = {
        id: this.templateModel().id,
        name: form.value.name,
        subject: form.value.subject,
        body: this.templateModel().body || ''
    };

    if (this.isNew) {
      const newTemplate: EmailTemplate = {
        ...formData,
        id: `tpl-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      await this.dataService.addTemplate(newTemplate);
    } else {
      const updatedTemplate: EmailTemplate = {
          ...this.templateModel(),
          ...formData
      } as EmailTemplate;
      await this.dataService.updateTemplate(updatedTemplate);
    }
    this.uiService.closeTemplateEditor();
  }
}
