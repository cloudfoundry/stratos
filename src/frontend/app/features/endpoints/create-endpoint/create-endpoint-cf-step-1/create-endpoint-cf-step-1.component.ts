/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { Component, OnInit, ViewChild, AfterContentInit } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CNSISModel, CNSISState, cnsisStoreNames } from '../../../../store/types/cnsis.types';
import { UtilsService } from '../../../../core/utils.service';
import { StepOnNextFunction, IStepperStep } from '../../../../shared/components/stepper/step/step.component';
import { cnsisEntitiesSelector } from '../../../../store/selectors/cnsis.selectors';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { RegisterCnis } from '../../../../store/actions/cnsis.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { selectEntity, selectUpdateInfo, selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { CNSISEffect } from '../../../../store/effects/cnsis.effects';
import { shareReplay } from 'rxjs/operators';
import { tag } from 'rxjs-spy/operator/tag';

@Component({
  selector: 'app-create-endpoint-cf-step-1',
  templateUrl: './create-endpoint-cf-step-1.component.html',
  styleUrls: ['./create-endpoint-cf-step-1.component.scss']
})
export class CreateEndpointCfStep1Component implements OnInit, IStepperStep, AfterContentInit {

  endpointNames: Observable<string[]>;
  endpointUrls: Observable<string[]>;

  validate: Observable<boolean>;

  @ViewChild('form') form: NgForm;
  @ViewChild('nameField') nameField: NgModel;
  @ViewChild('urlField') urlField: NgModel;
  @ViewChild('skipSllField') skipSllField: NgModel;

  constructor(private store: Store<AppState>, public utilsService: UtilsService) {

    this.endpointNames = store.select(cnsisEntitiesSelector)
      .map(cnsis => Object.values(cnsis).map(cnsi => cnsi.name));

    this.endpointUrls = store.select(cnsisEntitiesSelector)
      .map(cnsis => Object.values(cnsis).map(cnsi => {
        if (cnsi.api_endpoint) {
          return `${cnsi.api_endpoint.Scheme}://${cnsi.api_endpoint.Host}`;
        } else {
          return 'Unknown';
        }
      }));
  }

  ngOnInit() {}

  onNext: StepOnNextFunction = () => {

    console.log('Register');
    console.log(this.nameField.value);
    console.log(this.urlField.value);
    console.log(this.skipSllField.value);
    const action = new RegisterCnis(
      this.nameField.value,
      this.urlField.value,
      !!this.skipSllField.value
    );
    
    this.store.dispatch(action);

    console.log(action.guid());

    const entityRequestSelect$ = this.store.select(selectRequestInfo(cnsisStoreNames.type, action.guid())).pipe(
      shareReplay(1),
    );
    
    // entityRequestSelect$.do(d => {
    //   console.log('UPDATE');
    //   console.log(d);
    //   // if (!newVal.error && (oldVal.busy && !newVal.busy)) {
    //   //   // Has finished fetching
    //   //   this.store.dispatch(new GetSystemInfo());
    // });

    //entityRequestSelect$.subscribe();
      // }
    
    // this.store.dispatch(new RouterNav({ path: ['endpoints'] }));

    //.map(request => !!(request && request.info && request.info.user));

    console.log(cnsisStoreNames.type);

    const update$ = this.store.select(
      this.getUpdateSelector(action.guid())
    ).filter(update => !!update);
    

    return update$.pairwise()
    .filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy))
    .map(([oldVal, newVal]) => newVal)
    .map(result => {
      if (!result.error) {
        this.store.dispatch(new RouterNav({ path: ['endpoints'] }));
      }

      return {
        success: !result.error
      }
    });
    //return Observable.of({ success: true });
  }

  ngAfterContentInit() {
    this.validate = this.form.statusChanges
      .map(() => {
        return this.form.valid;
      });
  }

  private getUpdateSelector(id) {
    return selectUpdateInfo(
      cnsisStoreNames.type,
      id,
      CNSISEffect.registeringKey
    );
  }


  // registerEndpoint(): Observable<RequestInfoState> {
    // const { cloudFoundry, org, space } = cloudFoundryDetails;
    // const newAppGuid = name + space;

    // this.store.dispatch(new RegisterCnis(
      
    //   newAppGuid,
    //   cloudFoundry, {
    //     name,
    //     space_guid: space
    //   }
    // ));
    // return this.store.select(selectRequestInfo(ApplicationSchema.key, newAppGuid));
  // }
}