import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { filter, first, map, pairwise, startWith, switchMap } from 'rxjs/operators';

import { IStepperStep, StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { DeleteEndpointRelation, SaveEndpointRelation } from '../../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { EndpointsEffect } from '../../../../../../store/src/effects/endpoint.effects';
import { endpointSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { selectEntity, selectUpdateInfo } from '../../../../../../store/src/selectors/api.selectors';
import { endpointsRegisteredMetricsEntitiesSelector } from '../../../../../../store/src/selectors/endpoint.selectors';
import { EndpointModel, EndpointRelationTypes, EndpointsRelation } from '../../../../../../store/src/types/endpoint.types';

export enum CfSchedulers {
  DIEGO = 'Deigo',
  EIRINI = 'Eirini'
}

@Component({
  selector: 'app-cf-scheduler-step',
  templateUrl: './cf-scheduler-step.component.html',
  styleUrls: ['./cf-scheduler-step.component.scss']
})
export class CfSchedulerStepComponent implements OnInit, IStepperStep {

  constructor(
    private store: Store<AppState>,
    private fb: FormBuilder,
    activatedRoute: ActivatedRoute
  ) {
    this.cfGuid = activatedRoute.snapshot.params.endpointId;

    this.cf$ = store.select(selectEntity<EndpointModel>(endpointSchemaKey, this.cfGuid)).pipe(
      filter(endpoint => !!endpoint),
    );
    this.cfName$ = this.cf$.pipe(
      map(entity => entity.name)
    );

    this.metricsEndpoints$ = store.select(endpointsRegisteredMetricsEntitiesSelector).pipe(
      map(registeredMetrics => Object.values(registeredMetrics)),
    );

    this.eiriniDefaultNamespace$ = store.select('auth').pipe(
      map((auth) => auth.sessionData &&
        auth.sessionData['plugin-config'] &&
        auth.sessionData['plugin-config'].eiriniDefaultNamespace || null
      ));

    this.blocked = combineLatest([
      this.metricsEndpoints$,
      this.eiriniDefaultNamespace$,
      this.cf$
    ]).pipe(
      map(() => false),
      startWith(true)
    );

    this.validate = this.form.statusChanges.pipe(
      map(() => this.form.valid),
      startWith(false)
    );

    // Track changes of scheduler
    this.form.controls.scheduler.valueChanges.subscribe(value => this.updateSelectedScheduler(value));
  }

  form: FormGroup = this.fb.group({
    scheduler: new FormControl('', [Validators.required]),
    eiriniMetrics: new FormControl('', [Validators.required]),
    eiriniNamespace: new FormControl('', [Validators.required])
  });
  metricsEndpoints$: Observable<EndpointModel[]>;
  eiriniDefaultNamespace$: Observable<string>;
  cfGuid: string;
  schedulers = CfSchedulers;
  blocked: Observable<boolean>;
  validate: Observable<boolean>;
  cfName$: Observable<string>;
  private cf$: Observable<EndpointModel>;

  private existingRelation: EndpointsRelation;

  onNext: StepOnNextFunction = () => {
    return this.deleteExistingRelation().pipe(
      switchMap((res): Observable<ActionState> => res.error ? of(res) : this.saveRelation()),
      map(res => ({
        success: !res.error,
        message: res.message,
        redirect: !res.error
      }))
    );
  }

  deleteExistingRelation(): Observable<ActionState> {
    if (this.existingRelation) {
      this.store.dispatch(new DeleteEndpointRelation(this.cfGuid, this.existingRelation, 'cf'));
      return this.store.select(selectUpdateInfo(endpointSchemaKey, this.cfGuid, EndpointsEffect.deleteRelationKey)).pipe(
        pairwise(),
        filter(([oldVal, newVal]) => oldVal.busy && !newVal.busy),
        map(([oldV, newV]: [ActionState, ActionState]) => {
          return {
            ...newV,
            message: `Failed to delete existing relation${newV.message ? `: ${newV.message}` : ''}`,
          };
        })
      );
    }
    return of({
      busy: false,
      error: false,
      message: null
    });
  }

  saveRelation(): Observable<ActionState> {
    if (this.form.controls.scheduler.value === CfSchedulers.EIRINI) {
      this.store.dispatch(new SaveEndpointRelation(this.cfGuid, {
        guid: this.form.controls.eiriniMetrics.value,
        type: EndpointRelationTypes.KUBEMETRICS_CF,
        metadata: {
          namespace: this.form.controls.eiriniNamespace.value
        }
      }, 'cf'));

      return this.store.select(selectUpdateInfo(endpointSchemaKey, this.cfGuid, EndpointsEffect.updateRelationKey)).pipe(
        pairwise(),
        filter(([oldVal, newVal]) => oldVal.busy && !newVal.busy),
        map(([oldV, newV]: [ActionState, ActionState]) => {
          return {
            ...newV,
            message: `Failed to save relation${newV.message ? `: ${newV.message}` : ''}`,
          };
        })
      );
    }
    // For diego there's no eirini relationship to save, so no op (any existing eirini relation would have been removed in previous step)
    return of({
      busy: false,
      error: false,
      message: null
    });
  }

  ngOnInit() {
    // Set the initial values
    combineLatest([
      this.metricsEndpoints$,
      this.eiriniDefaultNamespace$,
      this.cf$
    ]).pipe(
      first()
    ).subscribe(([registeredMetrics, eiriniDefaultNamespace, cf]) => {
      // Set starting values
      this.form.controls.eiriniNamespace.setValue(eiriniDefaultNamespace);
      this.form.controls.scheduler.setValue(CfSchedulers.DIEGO);

      // Update given
      if (registeredMetrics.length === 0) {
        // Should never get here
        return;
      } else {
        // Is there an already bound relation?
        const relations = cf.relations ? cf.relations.receives : [];
        this.existingRelation = relations.find(receive => receive.type === EndpointRelationTypes.KUBEMETRICS_CF);
        if (!!this.existingRelation && !!registeredMetrics.find(registeredMetric => registeredMetric.guid === this.existingRelation.guid)) {
          // Cf is already bound to eirini metrics
          this.form.controls.eiriniMetrics.setValue(this.existingRelation.guid);
          this.form.controls.eiriniNamespace.setValue(this.existingRelation.metadata.namespace || eiriniDefaultNamespace);
          this.form.controls.scheduler.setValue(CfSchedulers.EIRINI);
        } else {
          // Select the first one as default
          this.form.controls.eiriniMetrics.setValue(registeredMetrics[0].guid);
        }
      }
    });
  }

  updateSelectedScheduler(scheduler: string) {
    if (scheduler === CfSchedulers.EIRINI) {
      this.form.controls.eiriniMetrics.enable();
      this.form.controls.eiriniNamespace.enable();
    } else {
      this.form.controls.eiriniMetrics.disable();
      this.form.controls.eiriniNamespace.disable();
    }
  }

}


      // for (let i = 0; i < registeredMetrics.length; i++) {
      //   const registeredEndpoint = registeredMetrics[i];

      //   if (i === 0) {
      //     this.form.controls.eiriniMetrics.setValue(registeredEndpoint.guid);
      //     continue;
      //   }

      //   if (!registeredEndpoint.relations) {
      //     continue;
      //   }
      //   const cfAlreadyBound = registeredEndpoint.relations.provides.find(provideRelationship => {
      //     return provideRelationship.guid === this.cfGuid && provideRelationship.type === EndpointRelationTypes.KUBEMETRICS_CF;
      //   });
      //   if (cfAlreadyBound) {
      //     this.form.controls.eiriniMetrics.setValue(registeredEndpoint.guid);
      //     break;
      //   }
      // }
