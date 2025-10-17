/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import '@angular/compiler';
import {provideZonelessChangeDetection} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

import {AppComponent} from './src/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.