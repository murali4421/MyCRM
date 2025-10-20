import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Product } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-product-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeProductModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="rounded-lg shadow-xl w-full max-w-lg" [class]="themeService.c('bg-primary')">
        <header class="p-4 border-b flex justify-between items-center" [class]="themeService.c('border-primary')">
            <h2 class="text-xl font-semibold" [class]="themeService.c('text-primary')">{{ isNew ? 'New Product/Service' : 'Edit Product/Service' }}</h2>
            <button (click)="uiService.closeProductModal()" class="p-2 rounded-full" [class]="themeService.c('bg-primary-hover')">
              <svg class="h-6 w-6" [class]="themeService.c('text-secondary')" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <form #productForm="ngForm" (ngSubmit)="saveProduct(productForm)">
            <div class="p-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Name</label>
                        <input type="text" name="name" [ngModel]="productModel()?.name" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:border-accent') + ' ' + themeService.c('focus:ring-accent')">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Category</label>
                            <select name="category" [ngModel]="productModel()?.category" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('focus:outline-none') + ' ' + themeService.c('focus:ring-accent') + ' ' + themeService.c('focus:border-accent')">
                                @for(cat of productCategories; track cat) {
                                    <option [value]="cat">{{cat}}</option>
                                }
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Price (USD)</label>
                            <input type="number" name="price" [ngModel]="productModel()?.price" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium" [class]="themeService.c('text-base')">Description</label>
                        <textarea name="description" [ngModel]="productModel()?.description" rows="5" required class="mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('border-secondary')"></textarea>
                    </div>
                </div>
            </div>
            <footer class="px-6 pb-6 pt-4 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeProductModal()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-secondary') + ' ' + themeService.c('border-secondary') + ' ' + themeService.c('text-primary') + ' ' + themeService.c('bg-secondary-hover')">Cancel</button>
                <button type="submit" [disabled]="productForm.invalid" class="text-white px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-accent') + ' ' + themeService.c('hover:bg-accent-hover') + ' ' + themeService.c('bg-disabled')">Save Product</button>
                @if(!isNew) {
                    <button type="button" (click)="deleteProduct()" class="border px-4 py-2 rounded-md text-sm font-medium" [class]="themeService.c('bg-danger-subtle') + ' ' + themeService.c('border-danger-subtle') + ' ' + themeService.c('text-danger') + ' ' + themeService.c('hover:bg-danger-subtle-hover')">Delete</button>
                }
            </footer>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductModalComponent {
  dataService = inject(DataService);
  uiService = inject(UiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  isNew = false;
  productModel = signal<Partial<Product>>({});
  productCategories: Product['category'][] = ['Software', 'Service', 'Hardware', 'Consulting'];

  constructor() {
    effect(() => {
        const selectedProduct = this.uiService.selectedProduct();
        untracked(() => {
            if (selectedProduct === undefined) return;
            if (selectedProduct === null) {
                this.isNew = true;
                this.productModel.set({ 
                    category: 'Software',
                    ownerId: this.authService.currentUser()?.id
                });
            } else {
                this.isNew = false;
                this.productModel.set({ ...selectedProduct });
            }
        });
    });
  }
  
  async saveProduct(form: NgForm) {
    if (form.invalid) return;
    const formData = { ...this.productModel(), ...form.value };

    if (this.isNew) {
      const newProduct: Product = {
        ...formData,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as Product;
      await this.dataService.addProduct(newProduct);
    } else {
      await this.dataService.updateProduct(formData as Product);
    }
    this.uiService.closeProductModal();
  }
  
  async deleteProduct() {
    if(this.productModel()?.id && confirm('Are you sure you want to delete this product?')) {
        await this.dataService.deleteProduct(this.productModel().id!);
        this.uiService.closeProductModal();
    }
  }
}
