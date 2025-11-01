import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { RunningInstancesComponent } from '../../../../cloud-foundry/src/shared/components/running-instances/running-instances.component';
import { MetadataItemComponent } from '../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { EntityService } from '../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../store/src/types/api.types';
import { GetAppAutoscalerPolicyAction } from '../../store/app-autoscaler.actions';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';


@Component({
  selector: 'app-card-autoscaler-default',
  templateUrl: './card-autoscaler-default.component.html',
  styleUrls: ['./card-autoscaler-default.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MetadataItemComponent,
    RunningInstancesComponent
  ]
})
export class CardAutoscalerDefaultComponent implements OnInit {

  @ViewChild('instanceField', { static: false }) instanceField!: ElementRef;

  constructor(
    public appService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory,
    private applicationService: ApplicationService,
    private cdr: ChangeDetectorRef
  ) {
  }

  appAutoscalerPolicyService!: EntityService;
  appAutoscalerPolicy$!: Observable<APIResource<AppAutoscalerPolicyLocal>>;
  applicationInstances$!: Observable<number>;

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
    this.cdr.markForCheck();
  }

}
