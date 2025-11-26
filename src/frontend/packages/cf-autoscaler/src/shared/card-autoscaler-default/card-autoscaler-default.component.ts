import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, type ElementRef, Input, type OnInit, ViewChild } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { type ApplicationService, RunningInstancesComponent, type IApp } from '@stratosui/cloud-foundry';
import { MetadataItemComponent } from '@stratosui/core';
import { EntityServiceFactory, type EntityService, type APIResource, type EntityInfo } from '@stratosui/store';
import { GetAppAutoscalerPolicyAction } from '../../store/app-autoscaler.actions';
import type { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';


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
  appAutoscalerPolicy$!: Observable<AppAutoscalerPolicyLocal | undefined>;
  applicationInstances$!: Observable<number>;

  @Input()
  onUpdate: () => void = () => { /* No-op callback */ }

  ngOnInit() {
    this.appAutoscalerPolicyService = this.entityServiceFactory.create<AppAutoscalerPolicyLocal>(
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid),
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      map((entityInfo: EntityInfo<AppAutoscalerPolicyLocal>) => {
        return entityInfo.entity;
      })
    );
    this.applicationInstances$ = this.applicationService.app$.pipe(
      map(({ entity }: EntityInfo<APIResource<IApp>>) => entity ? entity.entity.instances : null),
      publishReplay(1),
      refCount()
    );
    this.cdr.markForCheck();
  }

}
