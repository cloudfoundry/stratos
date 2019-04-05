import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { EndpointsService } from '../../../../core/endpoints.service';
import { IStepperStep, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { ConnectEndpointConfig, ConnectEndpointService } from '../../connect.service';


@Component({
  selector: 'app-create-endpoint-connect',
  templateUrl: './create-endpoint-connect.component.html',
  styleUrls: ['./create-endpoint-connect.component.scss']
})
export class CreateEndpointConnectComponent implements OnDestroy, IStepperStep {

  public validate: Observable<boolean>;
  public valid = false;
  // TODO: RC
  public helpDocumentUrl: string;
  public connectService: ConnectEndpointService;

  constructor(
    private store: Store<AppState>,
    private endpointsService: EndpointsService
  ) {

  }

  onEnter = (data: ConnectEndpointConfig) => {
    this.connectService = new ConnectEndpointService(this.store, this.endpointsService, data);
  }

  onNext = (): Observable<StepOnNextResult> => {
    return this.connectService.submit().pipe(
      map(res => ({
        success: res.success,
        message: res.errorMessage,
        redirect: res.success
      }))
    );
  }

  ngOnDestroy(): void {
    if (this.connectService) {
      this.connectService.destroy();
    }
  }

}
