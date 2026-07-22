import { Injector } from '@angular/core';

import { CfInfoDataRegistry } from './cf-info-data.registry';

// Module-level injector reference captured by CloudFoundryPackageModule
// (mirrors the cf-autoscaler pattern in autoscaler-available.ts). The CF
// endpoint health-check callback is registered at entity-generator time,
// which runs outside an Angular injection context, so it reaches the
// CfInfoDataRegistry through this captured root injector.
let helperInjector: Injector | null = null;

export function setCfInfoHelperInjector(injector: Injector): void {
  helperInjector = injector;
}

export function refreshCfInfo(cnsiGuid: string): void {
  if (!helperInjector) {
    // Module not yet initialized — drop the refresh on the floor. The CF
    // package module constructor sets this synchronously at bootstrap, so
    // this only fires in test setups that don't bring in the package.
    return;
  }
  const registry = helperInjector.get(CfInfoDataRegistry);
  registry.acquire(cnsiGuid).refresh().subscribe({ error: () => { /* errors land in service.errors() */ } });
}
