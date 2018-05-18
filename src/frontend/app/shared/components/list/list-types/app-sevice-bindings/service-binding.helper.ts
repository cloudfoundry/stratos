import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { DeleteServiceBinding } from '../../../../../store/actions/service-bindings.actions';

export const detachServiceBinding = (
  confirmDialog: ConfirmationDialogService,
  store: Store<AppState>,
  serviceBindingGuid: string,
  serviceInstanceGuid: string,
  endpointGuid: string
) => {
  const confirmation = new ConfirmationDialogConfig(
    'Detach Service Instance',
    'Are you sure you want to detach the application from the service?',
    'Detach',
    true
  );
  confirmDialog.open(confirmation, () =>
    store.dispatch(new DeleteServiceBinding(endpointGuid, serviceBindingGuid, serviceInstanceGuid))
  );
};
