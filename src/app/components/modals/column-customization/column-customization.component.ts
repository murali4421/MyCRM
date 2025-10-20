import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../services/ui.service';
import { ColumnConfig } from '../../../models/crm.models';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-column-customization',
  imports: [CommonModule, FormsModule],
  template: `
    @if(activeTable()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/10 z-30" (click)="uiService.activeColumnCustomization.set(null)"></div>
      <!-- Panel -->
      <div class="fixed top-0 right-0 h-full w-80 shadow-lg z-40 transform transition-transform duration-300 ease-in-out"
           [class]="themeService.c('bg-primary') + (!!activeTable() ? ' translate-x-0' : ' translate-x-full')">
        <div class="flex flex-col h-full">
            <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
                <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">Customize Columns</h2>
                <button (click)="uiService.activeColumnCustomization.set(null)" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
                    <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <div class="p-4 flex-1 overflow-y-auto">
                <p class="text-sm mb-4" [class]="themeService.c('text-secondary')">Select which columns to show for the {{ activeTable() }} table.</p>
                <div class="space-y-2">
                    @if(columnsForActiveTable(); as columns) {
                        @for (col of columns; track col.id) {
                            <label class="flex items-center space-x-3 p-2 rounded-md" [class]="themeService.c('bg-primary-hover')">
                                <input type="checkbox" [checked]="col.visible" (change)="toggleColumn(col.id)" class="h-4 w-4 rounded" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-accent') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent')">
                                <span class="text-sm" [class]="themeService.c('text-base')">{{ col.label }}</span>
                            </label>
                        }
                    }
                </div>
            </div>
            <footer class="p-4 border-t" [class]="themeService.c('border-primary')">
                <button (click)="uiService.activeColumnCustomization.set(null)" class="w-full text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover')">Done</button>
            </footer>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnCustomizationComponent {
  uiService = inject(UiService);
  themeService = inject(ThemeService);

  activeTable = this.uiService.activeColumnCustomization;

  columnsForActiveTable = computed(() => {
    const table = this.activeTable();
    if (!table) return [];
    return this.uiService.tableColumnConfigs()[table];
  });

  toggleColumn(columnId: string) {
    const table = this.activeTable();
    if (!table) return;

    this.uiService.tableColumnConfigs.update(configs => {
      const newColumns = configs[table].map(col => {
        if (col.id === columnId) {
          return { ...col, visible: !col.visible };
        }
        return col;
      });
      return { ...configs, [table]: newColumns };
    });
  }
}
