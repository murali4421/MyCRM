import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { UiService } from '../../services/ui.service';
import { Product } from '../../models/crm.models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <h1 class="text-3xl font-bold text-gray-100">Products & Services</h1>
          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              placeholder="Search products..." 
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-48 order-first sm:order-none">
            <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" class="bg-gray-800 text-gray-200 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-auto">
              <option value="created_desc">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
            <button (click)="uiService.openProductModal(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium whitespace-nowrap">Add Product</button>
          </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (product of paginatedProducts(); track product.id) {
          <div class="bg-gray-800 rounded-lg shadow-sm border border-gray-700 flex flex-col hover:border-indigo-500/50 transition-colors duration-200 cursor-pointer" (click)="uiService.openProductModal(product)">
            <div class="p-5 flex-grow">
              <div class="flex justify-between items-start">
                  <h3 class="font-bold text-lg text-gray-100">{{product.name}}</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" [class]="getCategoryBadgeClass(product.category)">
                    {{ product.category }}
                  </span>
              </div>
              <p class="text-2xl font-extrabold text-gray-50 mt-2">{{product.price | currency}}</p>
              <p class="text-sm text-gray-400 mt-3 h-20 overflow-hidden">
                {{ product.description }}
              </p>
            </div>
          </div>
        }
        @empty {
          <div class="col-span-full text-center py-16 text-gray-400">
            <h3 class="text-lg font-semibold">No products found.</h3>
            <p class="mt-1">Create one to get started!</p>
          </div>
        }
      </div>

      @if (totalPages() > 0 && filteredProducts().length > 0) {
        <div class="flex items-center justify-between mt-6 py-3 px-4 bg-gray-800 border-t border-gray-700 rounded-lg shadow-sm">
          <div class="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div>
              <p class="text-sm text-gray-300">
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
               <select [ngModel]="itemsPerPage()" (ngModelChange)="changeItemsPerPage($event)" class="p-2 border rounded-md bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                  <option [ngValue]="9">9 per page</option>
                  <option [ngValue]="12">12 per page</option>
                  <option [ngValue]="24">24 per page</option>
               </select>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </button>
                <span class="hidden sm:inline-flex relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> Page {{ currentPage() }} of {{ totalPages() }} </span>
                <span class="inline-flex sm:hidden relative items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300"> {{ currentPage() }} / {{ totalPages() }} </span>
                <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50">
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

  private getVisibleUserIds = computed(() => {
    const currentUser = this.authService.currentUser();
    const allRoles = this.dataService.roles();

    if (!currentUser || !currentUser.roleId || !allRoles.length) {
      return [];
    }
    
    const userRole = allRoles.find(r => r.id === currentUser.roleId);

    if (!userRole || !userRole.name) {
      return [];
    }
  
    if (userRole.name === 'Admin') {
      return this.dataService.users().map(u => u.id);
    }
    
    if (userRole.name === 'Manager') {
      const teamMemberIds = this.dataService.users().filter(u => u.managerId === currentUser.id).map(u => u.id);
      return [currentUser.id, ...teamMemberIds];
    }
    
    return [currentUser.id]; // Sales Rep
  });

  visibleProducts = computed(() => this.dataService.products().filter(p => this.getVisibleUserIds().includes(p.ownerId)));

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const sort = this.sortBy();

    let products = this.visibleProducts().filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );

    return [...products].sort((a, b) => {
      switch(sort) {
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
    const perPage = this.itemsPerPage();
    if (total === 0) return 0;
    return Math.ceil(total / perPage);
  });

  paginatedProducts = computed(() => {
    const products = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return products.slice(start, end);
  });
  
  startItemNumber = computed(() => {
    const total = this.filteredProducts().length;
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
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
      'Software': 'bg-sky-500/10 text-sky-300',
      'Service': 'bg-emerald-500/10 text-emerald-300',
      'Hardware': 'bg-rose-500/10 text-rose-300',
      'Consulting': 'bg-violet-500/10 text-violet-300',
    };
    return classMap[category] || 'bg-gray-500/10 text-gray-300';
  }
}