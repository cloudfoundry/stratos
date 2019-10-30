import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { ShowSideHelp } from '../../../../../store/src/actions/dashboard-actions';
import { ShowSnackBar } from '../../../../../store/src/actions/snackBar.actions';
import { EndpointOnlyAppState } from '../../../../../store/src/app-state';
import { EndpointsService } from '../../../core/endpoints.service';
import { ConnectEndpointConfig, ConnectEndpointService } from '../connect.service';


@Component({
  selector: 'app-connect-endpoint-dialog',
  templateUrl: './connect-endpoint-dialog.component.html',
  styleUrls: ['./connect-endpoint-dialog.component.scss'],
})
export class ConnectEndpointDialogComponent implements OnDestroy {

  public valid = false;
  public helpDocumentUrl: string;
  public connectService: ConnectEndpointService;

  private hasConnected: Subscription;

  constructor(
    public dialogRef: MatDialogRef<ConnectEndpointDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectEndpointConfig,
    private store: Store<EndpointOnlyAppState>,
    endpointsService: EndpointsService,
  ) {
    this.connectService = new ConnectEndpointService(store, endpointsService, data);

    this.hasConnected = this.connectService.hasConnected$.subscribe(() => {
      this.store.dispatch(new ShowSnackBar(`Connected endpoint '${this.data.name}'`));
      this.dialogRef.close();
    });
  }

  showHelp() {
    this.store.dispatch(new ShowSideHelp(this.helpDocumentUrl));
  }

  ngOnDestroy(): void {
    this.connectService.destroy();
    this.hasConnected.unsubscribe();
  }

}
