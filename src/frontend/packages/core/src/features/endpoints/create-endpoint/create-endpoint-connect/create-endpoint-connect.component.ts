import { Component, OnDestroy } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/endpoints.service';
import { MarkdownPreviewComponent } from '../../../../shared/components/markdown-preview/markdown-preview.component';
import { IStepperStep, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { SidePanelService } from '../../../../shared/services/side-panel.service';
import { ConnectEndpointConfig, ConnectEndpointService } from '../../connect.service';


@Component({
  selector: 'app-create-endpoint-connect',
  templateUrl: './create-endpoint-connect.component.html',
  styleUrls: ['./create-endpoint-connect.component.scss']
})
export class CreateEndpointConnectComponent implements OnDestroy, IStepperStep {

  public validate: Observable<boolean>;
  public valid = false;
  public helpDocumentUrl: string;
  public connectService: ConnectEndpointService;

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
  }

  onNext = (): Observable<StepOnNextResult> => this.doConnect ? this.connectService.submit().pipe(
    map(res => ({
      success: res.success,
      message: res.errorMessage,
      redirect: res.success
    }))
  ) : of({
    success: true,
    redirect: true
  })

  ngOnDestroy() {
    if (this.connectService) {
      this.connectService.destroy();
    }
  }

}
