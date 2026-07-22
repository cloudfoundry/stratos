import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, signal, Injector, inject } from '@angular/core';
import { AppProgressBarComponent } from '../../../shared/components/progress-bar/app-progress-bar.component';
import { MAT_DIALOG_DATA, TailwindDialogConfig, TailwindDialogRef } from '../../../shared/services/tailwind-dialog.service';
import { Observable, Subscription } from 'rxjs';
import { take, defaultIfEmpty, delay, startWith } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { EndpointsDataService } from '@stratosui/store';

import { EndpointsService } from '../../../core/endpoints.service';
import { BlurDirective } from '../../../shared/components/blur.directive';
import { DialogErrorComponent } from '../../../shared/components/dialog-error/dialog-error.component';
import { MarkdownPreviewComponent } from '../../../shared/components/markdown-preview/markdown-preview.component';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { TailwindSnackBarService } from '../../../shared/services/tailwind-snackbar.service';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointConfig, ConnectEndpointService } from '../connect.service';

/** Shared open() options for the connect dialog — every call site spreads
 *  this (adding its own `data`) so the dialog looks and behaves the same
 *  everywhere. Modeless + draggable so the endpoint card behind stays
 *  visible while connecting (its status pill reads "Connecting") and the
 *  panel can be dragged off the card. */
export const CONNECT_ENDPOINT_DIALOG_OPTIONS: TailwindDialogConfig = {
  disableClose: true,
  // Same footprint as the ConfirmationDialogService dialogs (e.g. the
  // Disconnect confirm) so all endpoint dialogs read as one family.
  width: '400px',
  maxWidth: '400px',
  panelClass: ['overflow-visible', 'p-6'],
  modeless: true,
};

@Component({
  selector: 'app-connect-endpoint-dialog',
  templateUrl: './connect-endpoint-dialog.component.html',
  styleUrls: ['./connect-endpoint-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    AppProgressBarComponent,
    BlurDirective,
    ConnectEndpointComponent,
    DialogErrorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectEndpointDialogComponent implements OnDestroy {
  dialogRef = inject<TailwindDialogRef<ConnectEndpointDialogComponent>>(TailwindDialogRef);
  data = inject<ConnectEndpointConfig>(MAT_DIALOG_DATA);
  private sidePanelService = inject(SidePanelService);
  private snackBarService = inject(TailwindSnackBarService);
  private injector = inject(Injector);


  public valid = false;
  public connectService: ConnectEndpointService;

  private hasConnected: Subscription;

  private _helpDocument = signal<string | null>(null);
  public helpDocument = this._helpDocument.asReadonly();
  public helpDocument$: Observable<string | null>;

  private endpointsData!: EndpointsDataService;

  // A failed reconnect does not touch the stored token, so if the endpoint
  // was already connected it still is. Read alongside the error message to
  // reassure the user their session survived the failed attempt.
  get stillConnected(): boolean {
    return this.endpointsData.endpoints().get(this.data.guid)?.connectionStatus === 'connected';
  }

  constructor() {
    const data = this.data;
    const endpointsService = inject(EndpointsService);

    const endpointsData = inject(EndpointsDataService);
    this.endpointsData = endpointsData;
    this.connectService = new ConnectEndpointService(endpointsService, data, endpointsData, this.injector);

    this.hasConnected = this.connectService.hasConnected$.subscribe(() => {
      this.snackBarService.show(`Connected endpoint '${this.data.name}'`);
      this.dialogRef.close();
    });
    // delay(0) fixes expression changed error
    this.helpDocument$ = toObservable(this._helpDocument, { injector: this.injector }).pipe(startWith(''), delay(0));
  }

  showHelp(helpDocumentUrl: string) {
    this.sidePanelService.showModal(MarkdownPreviewComponent, { documentUrl: helpDocumentUrl });
  }

  ngOnDestroy(): void {
    this.connectService.destroy();
    this.hasConnected.unsubscribe();
  }

  // Auth types without a help document emit `help: undefined`.
  public setHelpLink(link: string | undefined) {
    this._helpDocument.set(link ?? null);
  }

  public connect() {
    this.connectService.submit().pipe(take(1), defaultIfEmpty(null)).subscribe();
  }
}
