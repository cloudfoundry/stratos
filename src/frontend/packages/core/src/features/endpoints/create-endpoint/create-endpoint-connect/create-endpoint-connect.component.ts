
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnDestroy, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { EndpointAuthTypeConfig, EndpointsDataService } from '@stratosui/store';

import { EndpointsService } from '../../../../core/endpoints.service';
import { BlurDirective } from '../../../../shared/components/blur.directive';
import { MarkdownPreviewComponent } from '../../../../shared/components/markdown-preview/markdown-preview.component';
import { IStepperStep, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { SidePanelService } from '../../../../shared/services/side-panel.service';
import { ConnectEndpointComponent } from '../../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointConfig, ConnectEndpointService } from '../../connect.service';
import { DialogErrorComponent } from '../../../../shared/components/dialog-error/dialog-error.component';
import { EndpointCertificatesService, worstCertificateState } from '../../certificates/endpoint-certificates.service';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-create-endpoint-connect',
  templateUrl: './create-endpoint-connect.component.html',
  styleUrls: ['./create-endpoint-connect.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CustomCheckboxComponent,
    CustomIconComponent,
    BlurDirective,
    ConnectEndpointComponent,
    DialogErrorComponent,
    AsyncPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEndpointConnectComponent implements OnDestroy, IStepperStep {
  private endpointsService = inject(EndpointsService);
  private endpointsData = inject(EndpointsDataService);
  private injector = inject(Injector);
  private sidePanelService = inject(SidePanelService);
  private certificates = inject(EndpointCertificatesService);

  // Opened from a connect rather than a registration: the endpoint already
  // exists, so Connect now starts ticked.
  readonly fromConnect = input(false);
  // The endpoint is connected, so a failed attempt leaves that connection alone.
  readonly stillConnected = input(false);
  // Feed the Register strip.
  readonly endpointAddress = input('');
  readonly caCert = input('');
  // The strip's Review link.
  readonly review = output<void>();
  // Enter in the filled-in credentials form; the host connects as its button does.
  readonly submitted = output<void>();
  // Set only when the CA is expiring or expired.
  readonly caBadge = signal<'expiring' | 'expired' | null>(null);

  constructor() {
    effect(() => {
      const pem = this.caCert();
      void this.updateCaBadge(pem);
    });
  }

  private badgeRun = 0;
  private async updateCaBadge(pem: string) {
    const run = ++this.badgeRun;
    let state: ReturnType<typeof worstCertificateState> = null;
    if (pem.trim()) {
      try {
        state = worstCertificateState(await this.certificates.decode(pem));
      } catch {
        state = null;
      }
    }
    if (run === this.badgeRun) {
      this.caBadge.set(state === 'expiring' || state === 'expired' ? state : null);
    }
  }

  public validate!: Observable<boolean>;
  // Unset until an auth type with a help document is selected. Signals:
  // the connect form names its auth type while this template renders.
  public readonly helpDocumentUrl = signal<string | undefined>(undefined);
  private static readonly defaultCredentialsTitle = 'Connection Credentials';
  public readonly credentialsTitle = signal(CreateEndpointConnectComponent.defaultCredentialsTitle);
  // Unset until the stepper calls onEnter; the step's template can render
  // before that (it is projected as soon as the step becomes current).
  public readonly connectService = signal<ConnectEndpointService | undefined>(undefined);

  // FWT-959 Part 2: signal-backed mirrors of `valid` and `doConnect` so
  // parent steppers can wire them into a SignalStepHandle without polling
  // plain fields. Existing field-shaped reads still work via getter/setter
  // pairs — this is purely additive so neither create-endpoint nor
  // git-registration consumers break.
  public validSignal = signal<boolean>(false);
  public doConnectSignal = signal<boolean>(false);
  get valid(): boolean { return this.validSignal(); }
  set valid(v: boolean) { this.validSignal.set(v); }
  get doConnect(): boolean { return this.doConnectSignal(); }
  set doConnect(v: boolean) { this.doConnectSignal.set(v); }

  // An auth type that titles its one field (a Git host's Personal Access
  // Token) says what to enter better than "Connection Credentials".
  authTypeChanged(authType: EndpointAuthTypeConfig) {
    this.helpDocumentUrl.set(authType.help);
    this.credentialsTitle.set(authType.config?.title || CreateEndpointConnectComponent.defaultCredentialsTitle);
  }

  showHelp() {
    const documentUrl = this.helpDocumentUrl();
    if (!documentUrl) {
      return;
    }
    this.sidePanelService.showModal(MarkdownPreviewComponent, { documentUrl });
  }

  onEnter = (data: ConnectEndpointConfig) => {
    // Entered again after Previous: end the earlier connect first
    this.connectService()?.destroy();
    this.connectService.set(new ConnectEndpointService(this.endpointsService, data, this.endpointsData, this.injector));
    // Each entry starts fresh (ticked only when opened from a connect): a
    // choice made for an earlier endpoint does not carry over.
    this.doConnect = this.fromConnect();
    this.valid = false;
    this.helpDocumentUrl.set(undefined);
    this.credentialsTitle.set(CreateEndpointConnectComponent.defaultCredentialsTitle);
  };

  onNext = (): Observable<StepOnNextResult> => {
    const service = this.connectService();
    return this.doConnect && service ? service.submit().pipe(
      map(res => ({
        success: res.success,
        message: res.errorMessage,
        redirect: res.success
      }))
    ) : of({
      success: true,
      redirect: true
    });
  };

  ngOnDestroy() {
    this.connectService()?.destroy();
  }

}
