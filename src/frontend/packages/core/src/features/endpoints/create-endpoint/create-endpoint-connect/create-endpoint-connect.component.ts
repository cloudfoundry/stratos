
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, inject, signal } from '@angular/core';
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
    ConnectEndpointComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEndpointConnectComponent implements OnDestroy, IStepperStep {
  private endpointsService = inject(EndpointsService);
  private endpointsData = inject(EndpointsDataService);
  private injector = inject(Injector);
  private sidePanelService = inject(SidePanelService);
  private cdr = inject(ChangeDetectorRef);


  public validate!: Observable<boolean>;
  // Unset until an auth type with a help document is selected. Signals:
  // the connect form names its auth type while this template renders.
  public readonly helpDocumentUrl = signal<string | undefined>(undefined);
  private static readonly defaultCredentialsTitle = 'Connection Credentials';
  public readonly credentialsTitle = signal(CreateEndpointConnectComponent.defaultCredentialsTitle);
  // Unset until the stepper calls onEnter; the step's template can render
  // before that (it is projected as soon as the step becomes current).
  public connectService?: ConnectEndpointService;

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
    this.connectService?.destroy();
    this.connectService = new ConnectEndpointService(this.endpointsService, data, this.endpointsData, this.injector);
    // Each registration starts unticked: a choice made for an earlier
    // endpoint does not carry over.
    this.doConnect = false;
    this.valid = false;
    this.helpDocumentUrl.set(undefined);
    this.credentialsTitle.set(CreateEndpointConnectComponent.defaultCredentialsTitle);
    // OnPush change detection: setting a non-signal field doesn't notify
    // the template, so the success message renders without the endpoint
    // name until something else triggers a check. Force a tick.
    this.cdr.markForCheck();
  };

  onNext = (): Observable<StepOnNextResult> => this.doConnect && this.connectService ? this.connectService.submit().pipe(
    map(res => ({
      success: res.success,
      message: res.errorMessage,
      redirect: res.success
    }))
  ) : of({
    success: true,
    redirect: true
  });

  ngOnDestroy() {
    if (this.connectService) {
      this.connectService.destroy();
    }
  }

}
