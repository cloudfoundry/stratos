import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ConfirmationDialogService } from '../components/confirmation-dialog.service';
import { ConfirmationDialogConfig } from '../components/confirmation-dialog.config';
import { IServiceBinding } from '../../core/cf-api-svc.types';
import { AppState } from '../../../../store/src/app-state';
import { APIResource } from '../../../../store/src/types/api.types';
import { RouterNav, RouterQueryParams } from '../../../../store/src/actions/router.actions';
import { DeleteServiceBinding } from '../../../../store/src/actions/service-bindings.actions';
import { DeleteServiceInstance } from '../../../../store/src/actions/service-instances.actions';


@Injectable()
export class ServiceActionHelperService {

  constructor(
    private confirmDialog: ConfirmationDialogService,
    private store: Store<AppState>,

  ) { }

  detachServiceBinding = (
    serviceBindings: APIResource<IServiceBinding>[],
    serviceInstanceGuid: string,
    endpointGuid: string,
    noConfirm = false
  ) => {

    if (serviceBindings.length > 1) {
      this.store.dispatch(new RouterNav({
        path: ['/services', endpointGuid, serviceInstanceGuid, 'detach']
      }));
      return;
    }
    if (!noConfirm) {

      const confirmation = new ConfirmationDialogConfig(
        'Detach Service Instance',
        'Are you sure you want to detach the application from the service?',
        'Detach',
        true
      );
      this.confirmDialog.open(confirmation, () =>
        this.store.dispatch(new DeleteServiceBinding(endpointGuid, serviceBindings[0].metadata.guid, serviceInstanceGuid))
      );
    } else {
      this.store.dispatch(new DeleteServiceBinding(endpointGuid, serviceBindings[0].metadata.guid, serviceInstanceGuid));
    }
  }

  deleteServiceInstance = (
    serviceInstanceGuid: string,
    serviceInstanceName: string,
    endpointGuid: string
  ) => {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Service Instance',
      {
        textToMatch: serviceInstanceName
      },
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () =>
      this.store.dispatch(new DeleteServiceInstance(endpointGuid, serviceInstanceGuid))
    );
  }


  editServiceBinding = (guid: string, endpointGuid: string, query: RouterQueryParams = {}) =>
    this.store.dispatch(new RouterNav({ path: ['/services', endpointGuid, guid, 'edit'], query: query }))
}
