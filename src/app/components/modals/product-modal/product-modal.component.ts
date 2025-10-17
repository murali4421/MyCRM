import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Product } from '../../../models/crm.models';
import { DataService } from '../../../services/data.service';
import { UiService } from '../../../services/ui.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-product-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 z-40" (click)="uiService.closeProductModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <header class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-100">{{ isNew ? 'New Product/Service' : 'Edit Product/Service' }}</h2>
            <button (click)="uiService.closeProductModal()" class="p-2 rounded-full hover:bg-gray-700">
              <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        <form #productForm="ngForm" (ngSubmit)="saveProduct(productForm)">
            <div class="p-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Name</label>
                        <input type="text" name="name" [ngModel]="productModel()?.name" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Category</label>
                            <select name="category" [ngModel]="productModel()?.category" required class="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 text-gray-200 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                @for(cat of productCategories; track cat) {
                                    <option [value]="cat">{{cat}}</option>
                                }
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300">Price (USD)</label>
                            <input type="number" name="price" [ngModel]="productModel()?.price" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Description</label>
                        <textarea name="description" [ngModel]="productModel()?.description" rows="5" required class="mt-1 block w-full px-3 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-sm shadow-sm"></textarea>
                    </div>
                </div>
            </div>
            <footer class="px-6 pb-6 pt-4 flex justify-end gap-2">
                <button type="button" (click)="uiService.closeProductModal()" class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">Cancel</button>
                <button type="submit" [disabled]="productForm.invalid" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium disabled:bg-gray-600">Save Product</button>
                @if(!isNew) {
                    <button type="button" (click)="deleteProduct()" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md hover:bg-red-500/20 text-sm font-medium">Delete</button>
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