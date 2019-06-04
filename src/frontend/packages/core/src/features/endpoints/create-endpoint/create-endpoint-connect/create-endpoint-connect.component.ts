import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ShowSideHelp } from '../../../../../../store/src/actions/dashboard-actions';
import { EndpointOnlyAppState } from '../../../../../../store/src/app-state';
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
  public helpDocumentUrl: string;
  public connectService: ConnectEndpointService;

  public doConnect = false;

  constructor(
    private store: Store<EndpointOnlyAppState>,
    private endpointsService: EndpointsService
  ) {
  }

  showHelp() {
    this.store.dispatch(new ShowSideHelp(this.helpDocumentUrl));
  }

  onEnter = (data: ConnectEndpointConfig) => {
    this.connectService = new ConnectEndpointService(this.store, this.endpointsService, data);
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
