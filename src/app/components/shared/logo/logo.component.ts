import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-logo',
  imports: [CommonModule],
  template: `
    <div class="rounded-lg flex items-center justify-center" [class]="sizeClass() + ' ' + themeService.c('bg-accent')">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-white" [class]="iconSizeClass()" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.5 12.75c0 .343.044.678.13 1a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 13.5V12a2.25 2.25 0 012.25-2.25h2.88a2.25 2.25 0 012.12 1.5z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.5 12.75c0 .343-.044.678-.13 1a2.25 2.25 0 002.25 2.25H19.5a2.25 2.25 0 002.25-2.25V12a2.25 2.25 0 00-2.25-2.25h-2.88a2.25 2.25 0 00-2.12 1.5z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.5 9.75V8.25c0-1.036.84-1.875 1.875-1.875h1.25c1.036 0 1.875.84 1.875 1.875V9.75" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5v1.5a2.25 2.25 0 002.25 2.25h.375a2.25 2.25 0 002.25-2.25V16.5m-4.5 0v1.5a2.25 2.25 0 01-2.25 2.25H7.125a2.25 2.25 0 01-2.25-2.25V16.5" />
        </svg>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  themeService = inject(ThemeService);
  sizeClass = input<string>('w-8 h-8');
  iconSizeClass = computed(() => {
    const size = this.sizeClass();
    if (size.includes('10')) { // w-10 h-10
      return 'w-6 h-6';
    }
    return 'w-5 h-5'; // default for w-8 h-8
  });
}