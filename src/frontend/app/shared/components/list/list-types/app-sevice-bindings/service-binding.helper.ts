import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { DeleteServiceBinding } from '../../../../../store/actions/service-bindings.actions';
import { DeleteServiceInstance } from '../../../../../store/actions/service-instances.actions';

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

export const deleteServiceInstance = (
  confirmDialog: ConfirmationDialogService,
  store: Store<AppState>,
  serviceInstanceGuid: string,
  endpointGuid: string
) => {
  const confirmation = new ConfirmationDialogConfig(
    'Delete Service Instance',
    'Are you sure you want to delete the service instance?',
    'Delete',
    true
  );
  confirmDialog.open(confirmation, () =>
    store.dispatch(new DeleteServiceInstance(endpointGuid, serviceInstanceGuid))
  );
};
