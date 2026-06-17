import { Router } from '@angular/router';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';

import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

// Services this builder needs from the host list component. Each list already
// injects these; passing them in keeps the builder free of Angular DI so it
// stays a plain, testable function.
export interface ServiceInstanceRowActionDeps {
  router: Router;
  confirmDialog: ConfirmationDialogService;
  snackBar: TailwindSnackBarService;
  // The host's delete chokepoint (CfServiceInstancesSignalConfigService
  // .deleteServiceInstance), so cache invalidation stays owned by the config.
  deleteServiceInstance: (cnsiGuid: string, guid: string) => Promise<void>;
  // Resolves the instance's offering bindability from the warmed
  // services-details store (CfServiceInstancesSignalConfigService
  // .isOfferingBindable). undefined → offering not cached yet (fail open).
  isOfferingBindable: (si: StServiceInstance) => boolean | undefined;
}

// supportsServiceKeys — service keys are broker-mediated credential bindings
// (type=key); CF only permits them on managed instances whose offering is
// bindable. Bindability comes from the already-fetched offerings cache, not
// the instance payload (broker_catalog isn't allowed in the instance list's
// sparse fieldset). We fail OPEN when bindability is unknown (cache cold) so
// the action isn't hidden during the brief warm-up; a non-bindable create
// still fails safely at the broker.
function supportsServiceKeys(
  si: StServiceInstance,
  isOfferingBindable: (si: StServiceInstance) => boolean | undefined,
): boolean {
  return si.type !== 'user-provided' && isOfferingBindable(si) !== false;
}

// buildServiceInstanceRowActions — the single source of truth for the per-row
// action menu on every service-instance list (services wall, CF services tab,
// space service-instances tab, marketplace offering instances). Previously each
// list pasted its own near-identical Edit/Detach/Delete builder, which let the
// Service Keys action drift in (it was only on the wall). Centralising here
// keeps them consistent and gates Service Keys uniformly.
export function buildServiceInstanceRowActions(
  si: StServiceInstance,
  deps: ServiceInstanceRowActionDeps,
): SignalListRowAction<StServiceInstance>[] {
  // The edit/detach/keys routes' :type segment branches on the row kind:
  // 'service' for managed, 'user-service' for user-provided.
  const siType = si.type === 'user-provided' ? 'user-service' : 'service';

  const actions: SignalListRowAction<StServiceInstance>[] = [
    {
      label: 'Edit', icon: 'edit',
      invoke: () => {
        void deps.router.navigate(['/services', siType, si.cnsiGuid, si.guid, 'edit']);
      },
    },
    {
      label: 'Detach', icon: 'link_off',
      invoke: () => {
        void deps.router.navigate(['/services', siType, si.cnsiGuid, si.guid, 'detach']);
      },
    },
  ];

  if (supportsServiceKeys(si, deps.isOfferingBindable)) {
    actions.push({
      label: 'Service Keys', icon: 'vpn_key',
      invoke: () => {
        void deps.router.navigate(['/services', siType, si.cnsiGuid, si.guid, 'keys']);
      },
    });
  }

  actions.push({
    label: 'Delete', icon: 'delete', danger: true,
    invoke: () => {
      const confirm = new ConfirmationDialogConfig(
        'Delete Service Instance',
        `Delete the service instance "${si.name}"? This cannot be undone and will detach any apps bound to it.`,
        'Delete',
        true,
      );
      deps.confirmDialog.open(confirm, async () => {
        try {
          await deps.deleteServiceInstance(si.cnsiGuid, si.guid);
        } catch (err: unknown) {
          deps.snackBar.error(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    },
  });

  return actions;
}
