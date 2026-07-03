import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';
import { environment } from './environments/environment';

// Import NgX-Charts compatibility shim for Angular 20+
import './shared/services/ngx-charts-compat';

if (environment.production) {
  enableProdMode();
}

// Monaco is loaded on demand by MonacoEditorComponent (all consumers are
// post-login) — keeping its ~1MB payload off the bootstrap critical path.
platformBrowserDynamic().bootstrapModule(AppModule);
