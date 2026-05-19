import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { LongRunningOperationsService } from '../../../../core/src/shared/services/long-running-op.service';
import { SnackBarService } from '../../../../core/src/shared/services/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class LongRunningCfOperationsService extends LongRunningOperationsService {
  private snackBarService = inject(SnackBarService);
  private http = inject(HttpClient);

  handleLongRunningCreateService(bindApp: boolean) {
    const message = `The operation to create the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status
    ${bindApp ? ` and then bind the application via the Application page.` : '.'}`;
    this.snackBarService.show(message, 'Dismiss');
  }

  handleLongRunningUpdateService(serviceInstanceGuid: string, cfGuid: string) {
    const message = `The operation to update the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status`;
    this.snackBarService.show(message, 'Dismiss');
    // Refresh the SI so its `last operation` value reflects "update / in progress".
    // Fire-and-forget — UI subscribes to the same SI elsewhere; this is just
    // a cache-warmer poke.
    this.touchServiceInstance(cfGuid, serviceInstanceGuid);
  }

  handleLongRunningDeleteService(serviceInstanceGuid: string, cfGuid: string) {
    const message = `The operation to delete the service instance is taking a long time and will continue in the background.
     Please refresh the service instance list to check it's status`;
    this.snackBarService.show(message, 'Dismiss');
    // Same rationale as the update handler — refresh so `last operation`
    // shows "delete / in progress".
    this.touchServiceInstance(cfGuid, serviceInstanceGuid);
  }

  private touchServiceInstance(cfGuid: string, serviceInstanceGuid: string) {
    this.http.get(`/pp/v1/cf/service_instances/${cfGuid}/${serviceInstanceGuid}`).subscribe({
      error: () => { /* swallow — best-effort cache warm */ },
    });
  }

}
