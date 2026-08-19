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
// post-login) — keeping its payload off the bootstrap critical path. Once
// the app is up and the browser is idle, prefetch it so the first editor
// surface opens without paying the chunk fetch at click time. Sessions
// that never open an editor spend the bandwidth idly; sessions that do
// get an instant editor — the trade is deliberate.
platformBrowserDynamic().bootstrapModule(AppModule).then(() => {
  const prefetch = () => import('./monaco-loader').then((m) => m.loadMonacoEditor()).catch(() => {
    // Best-effort: a failed prefetch just means the editor loads on demand.
  });
  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetch, { timeout: 30000 });
  } else {
    setTimeout(prefetch, 5000);
  }
});
