import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../services/ui.service';
import { ColumnConfig } from '../../../models/crm.models';

@Component({
  selector: 'app-column-customization',
  imports: [CommonModule, FormsModule],
  template: `
    @if(activeTable()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/10 z-30" (click)="uiService.activeColumnCustomization.set(null)"></div>
      <!-- Panel -->
      <div class="fixed top-0 right-0 h-full w-80 bg-gray-800 shadow-lg z-40 transform transition-transform duration-300 ease-in-out"
           [class.translate-x-0]="!!activeTable()"
           [class.translate-x-full]="!activeTable()">
        <div class="flex flex-col h-full">
            <header class="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-100">Customize Columns</h3>
                <button (click)="uiService.activeColumnCustomization.set(null)" class="p-2 rounded-full hover:bg-gray-700">
                    <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <div class="flex-1 p-4 space-y-3 overflow-y-auto">
                 @for(column of columns(); track column.id) {
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-200">{{ column.label }}</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" [checked]="column.visible" (change)="toggleColumnVisibility(column)" class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                 }
            </div>
            <footer class="p-4 border-t border-gray-700">
                <button (click)="uiService.activeColumnCustomization.set(null)" class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">Done</button>
            </footer>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnCustomizationComponent {
  uiService = inject(UiService);

  activeTable = this.uiService.activeColumnCustomization;
  
  columns = computed(() => {
    const table = this.activeTable();
    if (!table) return [];
    return this.uiService.tableColumnConfigs()[table] || [];
  });
  
  toggleColumnVisibility(column: ColumnConfig) {
    const tableKey = this.activeTable();
    if (!tableKey) return;

    this.uiService.tableColumnConfigs.update(configs => {
      const tableColumns = configs[tableKey].map(c => 
        c.id === column.id ? { ...c, visible: !c.visible } : c
      );
      return { ...configs, [tableKey]: tableColumns };
    });
  }
}
