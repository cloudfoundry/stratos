import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { EntityService } from '../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../store/src/types/api.types';
import { GetAppAutoscalerPolicyAction } from '../../store/app-autoscaler.actions';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';


@Component({
  selector: 'app-card-autoscaler-default',
  templateUrl: './card-autoscaler-default.component.html',
  styleUrls: ['./card-autoscaler-default.component.scss']
})
export class CardAutoscalerDefaultComponent implements OnInit {

  @ViewChild('instanceField') instanceField: ElementRef;

  constructor(
    public appService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory,
    private applicationService: ApplicationService,
  ) {
  }

  appAutoscalerPolicyService: EntityService;
  appAutoscalerPolicy$: Observable<APIResource<AppAutoscalerPolicyLocal>>;
  applicationInstances$: Observable<number>;

  @Input()
  onUpdate: () => void = () => { }

  ngOnInit() {
    this.appAutoscalerPolicyService = this.entityServiceFactory.create<APIResource<AppAutoscalerPolicyLocal>>(
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid),
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      map(({ entity }) => {
        return entity && entity.entity;
      })
    );
    this.applicationInstances$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.instances : null),
      publishReplay(1),
      refCount()
    );
  }

}
