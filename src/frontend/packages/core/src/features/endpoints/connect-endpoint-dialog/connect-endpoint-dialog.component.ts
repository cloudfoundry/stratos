import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { delay, first, startWith } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';
import { MarkdownPreviewComponent } from '../../../shared/components/markdown-preview/markdown-preview.component';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { SnackBarService } from '../../../shared/services/snackbar.service';
import { ConnectEndpointConfig, ConnectEndpointService } from '../connect.service';

@Component({
  selector: 'app-connect-endpoint-dialog',
  templateUrl: './connect-endpoint-dialog.component.html',
  styleUrls: ['./connect-endpoint-dialog.component.scss'],
})
export class ConnectEndpointDialogComponent implements OnDestroy {

  public valid = false;
  public connectService: ConnectEndpointService;

  private hasConnected: Subscription;

  public helpDocument = new BehaviorSubject<string>(null);
  public helpDocument$: Observable<string>;

  constructor(
    public dialogRef: MatDialogRef<ConnectEndpointDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectEndpointConfig,
    endpointsService: EndpointsService,
    private sidePanelService: SidePanelService,
    private snackBarService: SnackBarService,
  ) {
    this.connectService = new ConnectEndpointService(endpointsService, data);

    this.hasConnected = this.connectService.hasConnected$.subscribe(() => {
      this.snackBarService.show(`Connected endpoint '${this.data.name}'`);
      this.dialogRef.close();
    });
    // delay(0) fixes expression changed error
    this.helpDocument$ = this.helpDocument.asObservable().pipe(startWith(''), delay(0));
  }

  showHelp(helpDocumentUrl: string) {
    this.sidePanelService.showModal(MarkdownPreviewComponent, { documentUrl: helpDocumentUrl });
  }

  ngOnDestroy(): void {
    this.connectService.destroy();
    this.hasConnected.unsubscribe();
  }

  public setHelpLink(link: string) {
    this.helpDocument.next(link);
  }

  public connect() {
    this.connectService.submit().pipe(first()).subscribe();
  }
}
