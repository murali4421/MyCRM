import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked, AfterViewInit, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { EmailTemplate } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';

declare var Quill: any;

@Component({
  selector: 'app-email-template-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeTemplateEditor()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Template' : 'Edit Template' }}</h2>
            <button (click)="uiService.closeTemplateEditor()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6 overflow-y-auto">
           <form #templateForm="ngForm" (ngSubmit)="saveTemplate(templateForm)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300">Template Name</label>
                  <input type="text" name="name" [ngModel]="templateModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
                 <div>
                  <label class="block text-sm font-medium text-gray-300">Subject</label>
                  <input type="text" name="subject" [ngModel]="templateModel()?.subject" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
                <div>
                   <div class="flex justify-between items-center mb-2">
                      <label for="template-body-editor" class="block text-sm font-medium text-gray-300">Body</label>
                      <select #placeholderSelect (change)="insertPlaceholder(placeholderSelect.value); placeholderSelect.value=''" class="text-sm bg-gray-700 text-gray-200 border-gray-600 rounded-md py-1 pl-2 pr-8 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
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
              <div class="mt-8 pt-4 border-t border-gray-700 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeTemplateEditor()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" [disabled]="templateForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Template</button>
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
        // FIX: Added the missing 'createdAt' property to conform to the EmailTemplate interface.
        createdAt: new Date().toISOString(),
      };
      await this.dataService.addTemplate(newTemplate);
    } else {
      // FIX: The EmailTemplate type requires createdAt, but it was missing from the update payload.
      // Although `formData` is cast to EmailTemplate, it's safer to ensure all required fields exist.
      // Here, we trust that an existing template (this.templateModel()) already has `createdAt`.
      const updatedTemplate: EmailTemplate = {
          ...this.templateModel(),
          ...formData
      } as EmailTemplate;
      await this.dataService.updateTemplate(updatedTemplate);
    }
    this.uiService.closeTemplateEditor();
  }
}
