import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-email-template-preview-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeTemplatePreview()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 class="text-xl font-semibold text-gray-100">Preview: {{ template()?.name }}</h2>
            <button (click)="uiService.closeTemplatePreview()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6 overflow-y-auto">
            <div class="space-y-4">
                <div>
                    <p class="text-sm font-medium text-gray-400">Subject</p>
                    <p class="text-lg font-semibold text-gray-100">{{ template()?.subject }}</p>
                </div>
                <div class="border-t border-gray-700 pt-4">
                    <p class="text-sm font-medium text-gray-400 mb-2">Body</p>
                    <div class="prose prose-sm prose-invert max-w-none p-4 border border-gray-700 rounded-md bg-gray-900 min-h-[300px]">
                        <div [innerHTML]="sanitizedBody()"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplatePreviewModalComponent {
  uiService = inject(UiService);
  // FIX: Explicitly type `sanitizer` to ensure `DomSanitizer` methods are available and correctly type-checked.
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  template = this.uiService.previewingTemplate;

  sanitizedBody = computed(() => {
    const body = this.template()?.body || '';
    // Use the sanitizer to prevent XSS attacks
    return this.sanitizer.bypassSecurityTrustHtml(body);
  });
}
