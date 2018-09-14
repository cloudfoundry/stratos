import { AfterContentInit, Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

import { IServicePlan } from '../../../../core/cf-api-svc.types';
import { IApp } from '../../../../core/cf-api.types';
import { SetCreateServiceInstanceApp } from '../../../../store/actions/create-service-instance.actions';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { StepOnNextResult } from '../../stepper/step/step.component';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input()
  boundAppId: string;

  validateSubscription: Subscription;
  validate = new BehaviorSubject(true);
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  apps$: Observable<APIResource<IApp>[]>;
  guideText = 'Specify the application to bind (Optional)';
  selectedServicePlan: APIResource<IServicePlan>;
  bindingParams: object;

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
    });
  }

  private setBoundApp() {
    if (this.boundAppId) {
      this.stepperForm.controls.apps.setValue(this.boundAppId);
      this.stepperForm.controls.apps.disable();
      this.guideText = 'Specify binding params (optional)';
    }
  }

  ngAfterContentInit() {
    this.validateSubscription = this.stepperForm.controls['apps'].valueChanges.subscribe(app => {
      if (!app) {
        this.validate.next(true);
      }
    });


    this.apps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      switchMap(createServiceInstance => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstance.spaceGuid);
        return getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(createServiceInstance.cfGuid, createServiceInstance.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;
      }));
    this.setBoundApp();
  }

  onEnter = (selectedServicePlan: APIResource<IServicePlan>) => {
    this.selectedServicePlan = selectedServicePlan;
    // TODO: RC Remove
    this.selectedServicePlan = {
      entity: {
        name: 'shared',
        free: true,
        description: 'Shared service for public-service',
        service_guid: '977b0c26-9f39-46be-93f8-c33c0b37dcb0',
        extra: null,
        unique_id: '31f1eddd-af72-44bd-98d5-7ad8915c5852-plan-shared',
        'public': true,
        bindable: true,
        active: true,
        service_url: '/v2/services/977b0c26-9f39-46be-93f8-c33c0b37dcb0',
        service_instances_url: '/v2/service_plans/00da4974-5037-485a-96f0-cbbbf98dc8e9/service_instances',
        guid: '00da4974-5037-485a-96f0-cbbbf98dc8e9',
        cfGuid: '293a18c7-1504-410f-b59d-9536a5098d66',
        schemas: {
          service_binding: {
            create: {
              parameters: {
                'type': 'object',
                'properties': {
                  'first_name': {
                    'type': 'string'
                  },
                  'last_name': {
                    'type': 'string'
                  },
                  'address': {
                    'type': 'object',
                    'properties': {
                      'street_1': {
                        'type': 'string'
                      },
                      'street_2': {
                        'type': 'string'
                      },
                      'city': {
                        'type': 'string'
                      },
                      'state': {
                        'type': 'string',
                        'enum': [
                          'AL',
                          'AK',
                          'AS',
                          'AZ',
                          'AR',
                          'CA',
                          'CO',
                          'CT',
                          'DE',
                          'DC',
                          'FM',
                          'FL',
                          'GA',
                          'GU',
                          'HI',
                          'ID',
                          'IL',
                          'IN',
                          'IA',
                          'KS',
                          'KY',
                          'LA',
                          'ME',
                          'MH',
                          'MD',
                          'MA',
                          'MI',
                          'MN',
                          'MS',
                          'MO',
                          'MT',
                          'NE',
                          'NV',
                          'NH',
                          'NJ',
                          'NM',
                          'NY',
                          'NC',
                          'ND',
                          'MP',
                          'OH',
                          'OK',
                          'OR',
                          'PW',
                          'PA',
                          'PR',
                          'RI',
                          'SC',
                          'SD',
                          'TN',
                          'TX',
                          'UT',
                          'VT',
                          'VI',
                          'VA',
                          'WA',
                          'WV',
                          'WI',
                          'WY'
                        ]
                      },
                      'zip_code': {
                        'type': 'string'
                      }
                    }
                  },
                  'birthday': {
                    'type': 'string'
                  },
                  'notes': {
                    'type': 'string'
                  },
                  'phone_numbers': {
                    'type': 'array',
                    'items': {
                      'type': 'object',
                      'properties': {
                        'type': {
                          'type': 'string',
                          'enum': [
                            'cell',
                            'home',
                            'work'
                          ]
                        },
                        'number': {
                          'type': 'string'
                        }
                      },
                      'required': [
                        'type',
                        'number'
                      ]
                    }
                  }
                },
                'required': [
                  'last_name'
                ]
              }
            }
          },
          service_instance: {

          }
        }
      },
      metadata: {
        guid: 'f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
        url: '/v2/services/f88cdd0e-82e1-429c-be8b-7ab43644c3f4',
        created_at: '2017-11-27T17:07:02Z',
        updated_at: '2017-11-27T17:07:02Z'
      }
    };
  }

  submit = (): Observable<StepOnNextResult> => {
    this.setApp();
    return observableOf({
      success: true,
      data: this.selectedServicePlan
    });
  }

  setApp = () => this.store.dispatch(
    new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value, this.bindingParams)
  )

  ngOnDestroy(): void {
    this.validateSubscription.unsubscribe();
  }

}



