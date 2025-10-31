import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, signal, Injector  } from '@angular/core';
import { AppProgressBarComponent } from '../../../shared/components/progress-bar/app-progress-bar.component';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '../../../shared/services/tailwind-dialog.service';
import { Observable, Subscription } from 'rxjs';
import { delay, first, startWith } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { EndpointsService } from '../../../core/endpoints.service';
import { BlurDirective } from '../../../shared/components/blur.directive';
import { DialogErrorComponent } from '../../../shared/components/dialog-error/dialog-error.component';
import { MarkdownPreviewComponent } from '../../../shared/components/markdown-preview/markdown-preview.component';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { SnackBarService } from '../../../shared/services/snackbar.service';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointConfig, ConnectEndpointService } from '../connect.service';

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

  public valid = false;
  public connectService: ConnectEndpointService;

  private hasConnected: Subscription;

  private _helpDocument = signal<string | null>(null);
  public helpDocument = this._helpDocument.asReadonly();
  public helpDocument$: Observable<string | null>;

  constructor(
    public dialogRef: TailwindDialogRef<ConnectEndpointDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConnectEndpointConfig,
    endpointsService: EndpointsService,
    private sidePanelService: SidePanelService,
    private snackBarService: SnackBarService,
    private injector: Injector,
  ) {
    this.connectService = new ConnectEndpointService(endpointsService, data);

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

  public setHelpLink(link: string) {
    this._helpDocument.set(link);
  }

  public connect() {
    this.connectService.submit().pipe(first()).subscribe();
  }
}
