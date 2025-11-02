import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../services/ui.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-email-template-preview-modal',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeTemplatePreview()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center flex-shrink-0" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">Preview: {{ template()?.name }}</h2>
            <button (click)="uiService.closeTemplatePreview()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <div class="p-6 overflow-y-auto">
            <div class="space-y-4">
                <div>
                    <p class="text-sm font-medium" [class]="themeService.c('text-secondary')">Subject</p>
                    <p class="text-lg font-semibold" [class]="themeService.c('text-primary')">{{ template()?.subject }}</p>
                </div>
                <div class="border-t pt-4" [class]="themeService.c('border-primary')">
                    <p class="text-sm font-medium mb-2" [class]="themeService.c('text-secondary')">Body</p>
                    <div class="prose prose-sm prose-invert max-w-none p-4 border rounded-md min-h-[300px]" [class]="themeService.c('bg-base') + ' ' + themeService.c('border-primary')">
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
  themeService = inject(ThemeService);
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  template = this.uiService.previewingTemplate;

  sanitizedBody = computed(() => {
    const body = this.template()?.body || '';
    // Use the sanitizer to prevent XSS attacks
    return this.sanitizer.bypassSecurityTrustHtml(body);
  });
}
