import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';
import { environment } from './environments/environment';

// Import NgX-Charts compatibility shim for Angular 20+
import './shared/services/ngx-charts-compat';

if (environment.production) {
  enableProdMode();
}

// The default resource-timing buffer (250 entries) overflows on a full app
// load, silently dropping entries the diagnostics performance page needs.
performance.setResourceTimingBufferSize?.(500);

// Monaco is loaded on demand by MonacoEditorComponent (all consumers are
// post-login) — keeping its ~1MB payload off the bootstrap critical path.
platformBrowserDynamic().bootstrapModule(AppModule);
