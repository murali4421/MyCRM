import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { Product } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold" [class]="themeService.c('text-primary')">Products & Services</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search products..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-48 order-first sm:order-none"
              [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
            <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" class="border rounded-md shadow-sm py-2 px-3 focus:outline-none text-sm w-full sm:w-auto"
               [class]="themeService.c('bg-primary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
              <option value="created_desc">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
            <button (click)="uiService.openProductModal(null)" class="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('text-on-accent')">Add Product</button>
          </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (product of paginatedProducts(); track product.id) {
          <div class="rounded-lg shadow-sm border flex flex-col cursor-pointer transition-colors duration-200" 
               [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary') + ' ' + themeService.c('hover:border-accent') + '/50'"
               (click)="uiService.openProductModal(product)">
            <div class="p-5 flex-grow">
              <div class="flex justify-between items-start">
                  <h3 class="font-bold text-lg" [class]="themeService.c('text-primary')">{{product.name}}</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getCategoryBadgeClass(product.category)">
                    {{ product.category }}
                  </span>
              </div>
              <p class="text-2xl font-extrabold mt-2" [class]="themeService.c('text-primary')">{{product.price | currency}}</p>
              <p class="text-sm mt-3 h-20 overflow-hidden" [class]="themeService.c('text-secondary')">
                {{ product.description }}
              </p>
            </div>
          </div>
        }
        @empty {
          <div class="col-span-full text-center py-16" [class]="themeService.c('text-secondary')">
            <h3 class="text-lg font-semibold">No products found.</h3>
            <p class="mt-1">Create one to get started!</p>
          </div>
        }
      </div>

      @if (totalPages() > 0 && filteredProducts().length > 0) {
        <div class="flex items-center justify-between mt-6 py-3 px-4 border-t rounded-lg shadow-sm" [class]="themeService.c('bg-primary') + ' ' + themeService.c('border-primary')">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm" [class]="themeService.c('text-base')">
                Showing
                <span class="font-medium">{{ startItemNumber() }}</span>
                to
                <span class="font-medium">{{ endItemNumber() }}</span>
                of
                <span class="font-medium">{{ filteredProducts().length }}</span>
                results
              </p>
            </div>
            <div class="flex items-center space-x-4">
               <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md focus:outline-none text-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:ring-2') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                  <option [ngValue]="9">9 per page</option>
                  <option [ngValue]="12">12 per page</option>
                  <option [ngValue]="24">24 per page</option>
               </select>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="hidden sm:inline-flex relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> Page {{ currentPage() }} of {{ totalPages() }} </span>
                <span class="inline-flex sm:hidden relative items-center px-4 py-2 border text-sm font-medium" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-base')"> {{ currentPage() }} / {{ totalPages() }} </span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium disabled:opacity-50" [class]="themeService.c('border-secondary') + ' ' + themeService.c('bg-primary') + ' ' + themeService.c('text-secondary') + ' ' + themeService.c('bg-primary-hover')">
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  searchTerm = signal('');
  sortBy = signal<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'created_desc'>('created_desc');
  
  constructor() {
    effect(() => {
      this.searchTerm();
      this.sortBy();
      this.uiService.setCurrentPage('products', 1);
    });
    if (![9, 12, 24].includes(this.uiService.pagination().itemsPerPage)) {
      this.uiService.setItemsPerPage(9);
    }
  }
  
  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const sort = this.sortBy();
    let products = this.dataService.products().filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
    return [...products].sort((a, b) => {
      switch (sort) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'created_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: return 0;
      }
    });
  });

  itemsPerPage = computed(() => this.uiService.pagination().itemsPerPage);
  currentPage = computed(() => this.uiService.pagination().currentPage['products'] || 1);
  totalPages = computed(() => {
    const total = this.filteredProducts().length;
    return total > 0 ? Math.ceil(total / this.itemsPerPage()) : 0;
  });

  paginatedProducts = computed(() => {
    const all = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return all.slice(start, end);
  });

  startItemNumber = computed(() => {
    return this.filteredProducts().length > 0 ? (this.currentPage() - 1) * this.itemsPerPage() + 1 : 0;
  });

  endItemNumber = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredProducts().length);
  });

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages()) {
      this.uiService.setCurrentPage('products', newPage);
    }
  }

  changeItemsPerPage(value: string | number) {
    this.uiService.setItemsPerPage(Number(value));
  }

  getCategoryBadgeClass(category: Product['category']): string {
    const classMap: Record<Product['category'], string> = {
      'Software': this.themeService.c('bg-info-subtle') + ' ' + this.themeService.c('text-info'),
      'Service': this.themeService.c('bg-success-subtle') + ' ' + this.themeService.c('text-success'),
      'Hardware': this.themeService.c('bg-warning-subtle') + ' ' + this.themeService.c('text-warning'),
      'Consulting': this.themeService.c('bg-special-subtle') + ' ' + this.themeService.c('text-special'),
    };
    return classMap[category];
  }
}
