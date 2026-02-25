import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';
import { environment } from './environments/environment';

// Import NgX-Charts compatibility shim for Angular 20+
import './shared/services/ngx-charts-compat';

// Import Monaco Editor loader
import { loadMonacoEditor } from './monaco-loader';

if (environment.production) {
  enableProdMode();
}

// Load Monaco Editor before bootstrapping
loadMonacoEditor().then(() => {
  platformBrowserDynamic().bootstrapModule(AppModule);
}).catch(error => {
  console.error('Failed to load Monaco Editor:', error);
  // Bootstrap anyway to prevent total app failure
  platformBrowserDynamic().bootstrapModule(AppModule);
});
