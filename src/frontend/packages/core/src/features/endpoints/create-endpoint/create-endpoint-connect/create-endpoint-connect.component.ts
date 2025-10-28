import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/endpoints.service';
import { BlurDirective } from '../../../../shared/components/blur.directive';
import { MarkdownPreviewComponent } from '../../../../shared/components/markdown-preview/markdown-preview.component';
import { IStepperStep, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { SidePanelService } from '../../../../shared/services/side-panel.service';
import { ConnectEndpointComponent } from '../../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointConfig, ConnectEndpointService } from '../../connect.service';

@Component({
  selector: 'app-create-endpoint-connect',
  templateUrl: './create-endpoint-connect.component.html',
  styleUrls: ['./create-endpoint-connect.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    BlurDirective,
    ConnectEndpointComponent
  ]
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
