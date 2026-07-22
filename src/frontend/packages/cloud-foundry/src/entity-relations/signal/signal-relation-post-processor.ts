// Signal-native replacement for `validationPostProcessor`. Maintains a
// per-rootEntityType list of post-processors that the
// SignalRelationFetcherService runs once a fetch completes. Mirrors the
// dispatch-by-action-type switch in `entity-relations-post-processor.ts`
// but registry-based so the cloud-foundry module can wire processors at
// bootstrap rather than the legacy hard-coded GET_ORGANIZATION /
// GET_SPACE switch.

import { Injectable } from '@angular/core';
import { SignalRelationPostProcessor } from './signal-relation-types';

@Injectable({ providedIn: 'root' })
export class SignalRelationPostProcessorRegistry {
  private readonly byRoot = new Map<string, SignalRelationPostProcessor[]>();

  register(processor: SignalRelationPostProcessor): void {
    const list = this.byRoot.get(processor.rootEntityType);
    if (list) {
      // Replace existing same-instance registration to make register
      // idempotent under HMR / repeated module bootstraps.
      const idx = list.indexOf(processor);
      if (idx >= 0) {
        return;
      }
      list.push(processor);
    } else {
      this.byRoot.set(processor.rootEntityType, [processor]);
    }
  }

  unregister(processor: SignalRelationPostProcessor): void {
    const list = this.byRoot.get(processor.rootEntityType);
    if (!list) {
      return;
    }
    const idx = list.indexOf(processor);
    if (idx >= 0) {
      list.splice(idx, 1);
    }
    if (!list.length) {
      this.byRoot.delete(processor.rootEntityType);
    }
  }

  forRoot(rootEntityType: string): SignalRelationPostProcessor[] {
    return this.byRoot.get(rootEntityType) || [];
  }

  /** Test-only: clear all registrations. */
  _resetForTests(): void {
    this.byRoot.clear();
  }
}
