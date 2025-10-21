/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import '@angular/compiler';
import {enableProdMode, provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {AppComponent} from './src/app/app.component';

enableProdMode();

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.