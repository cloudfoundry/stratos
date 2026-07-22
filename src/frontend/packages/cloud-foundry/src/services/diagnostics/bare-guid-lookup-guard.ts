import { Injectable, inject, isDevMode } from '@angular/core';
import { isComposite } from '../../cf-entity-ref';
import { StratosDiagnostics } from './stratos-diagnostics.service';

@Injectable({ providedIn: 'root' })
export class BareGuidLookupGuard {
  private readonly diagnostics = inject(StratosDiagnostics);

  checkKey(key: string, entityType: string): string {
    if (isComposite(key)) return key;
    const stack = isDevMode() ? new Error().stack : undefined;
    console.warn(`bare-guid-entity-lookup: entityType=${entityType} key=${key}${stack ? '\n' + stack : ''}`);
    this.diagnostics.emitCounter('bare-guid-entity-lookup', { entityType, key });
    return key;
  }

  fallbackScan<T>(dict: Record<string, T>, bareGuid: string): T | null {
    const suffix = `:${bareGuid}`;
    for (const [k, v] of Object.entries(dict)) {
      if (k.endsWith(suffix)) return v;
    }
    return null;
  }
}
