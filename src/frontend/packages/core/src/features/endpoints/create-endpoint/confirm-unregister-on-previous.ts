import { ConfirmationDialogConfig } from '../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';

/**
 * Previous from a registration form's Connect step starts over: it
 * unregisters the endpoint just registered. Ask first; resolves true to go
 * back.
 */
export function confirmUnregisterOnPrevious(dialog: ConfirmationDialogService, name: string): Promise<boolean> {
  const config = new ConfirmationDialogConfig(
    'Unregister Endpoint',
    `Going back unregisters '${name}', so you can register it again. Unregister it?`,
    'Unregister',
    true,
  );
  return new Promise(resolve => dialog.openWithCancel(config, () => resolve(true), () => resolve(false)));
}
