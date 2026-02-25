
import { ChangeDetectionStrategy, Component, OnDestroy  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomCheckboxComponent } from '../../../../shared/components/custom-checkbox/custom-checkbox.component';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

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

  public validate!: Observable<boolean>;
  public valid = false;
  public helpDocumentUrl!: string;
  public connectService!: ConnectEndpointService;

  public doConnect = false;

  constructor(
    private endpointsService: EndpointsService,
    private sidePanelService: SidePanelService,
  ) {
  }

  showHelp() {
    this.sidePanelService.showModal(MarkdownPreviewComponent, { documentUrl: this.helpDocumentUrl });
  }

  onEnter = (data: ConnectEndpointConfig) => {
    this.connectService = new ConnectEndpointService(this.endpointsService, data);
  };

  onNext = (): Observable<StepOnNextResult> => this.doConnect ? this.connectService.submit().pipe(
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
