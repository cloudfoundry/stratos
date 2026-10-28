import { ConfirmationDialogConfig } from '../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { EndpointsSignalConfigService } from '../endpoints-page/endpoints-signal-config.service';

export interface UnregisterTarget {
  guid: string;
  name: string;
  type: string;
  // True for an endpoint only its creator can see.
  personal: boolean;
}

/**
 * Whether an endpoint is personal (visible to its creator only). The stored
 * endpoint's creator decides; before it reaches the endpoints map, it is
 * personal unless an admin left "system endpoint" ticked (only admins see
 * that checkbox, so everyone else registers a personal endpoint).
 */
export function isPersonalEndpoint(
  stored: { creator?: { system?: boolean } | null } | undefined,
  isAdmin: boolean,
  systemTicked: boolean,
): boolean {
  if (stored) {
    return !!stored.creator && !stored.creator.system;
  }
  return !(isAdmin && systemTicked);
}

/**
 * Asks, then unregisters the endpoint. Resolves true once it is gone; false
 * when the user keeps it or the request fails.
 */
export async function confirmAndUnregister(
  dialog: ConfirmationDialogService,
  svc: EndpointsSignalConfigService,
  ep: UnregisterTarget,
): Promise<boolean> {
  const config = new ConfirmationDialogConfig(
    `Unregister ${ep.name}?`,
    `This removes the endpoint for ${ep.personal ? 'you' : 'all users'} and ends every connection to it. ` +
      'You can register it again later.',
    'Unregister',
    true,
    undefined,
    'Keep it',
  );
  const confirmed = await new Promise<boolean>(resolve =>
    dialog.openWithCancel(config, () => resolve(true), () => resolve(false)));
  if (!confirmed) {
    return false;
  }
  const state = await svc.unregister(ep.guid, ep.type);
  return !state.error;
}
