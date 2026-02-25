import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { CustomIconComponent, PageHeaderComponent, SteppersComponent, StepComponent } from '@stratosui/core';
import { EditAutoscalerPolicyStep1Component } from './edit-autoscaler-policy-step1/edit-autoscaler-policy-step1.component';
import { EditAutoscalerPolicyStep2Component } from './edit-autoscaler-policy-step2/edit-autoscaler-policy-step2.component';
import { EditAutoscalerPolicyStep3Component } from './edit-autoscaler-policy-step3/edit-autoscaler-policy-step3.component';
import { EditAutoscalerPolicyStep4Component } from './edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

@Component({
  selector: 'app-edit-autoscaler-policy',
  templateUrl: './edit-autoscaler-policy.component.html',
  styleUrls: ['./edit-autoscaler-policy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
    EditAutoscalerPolicyService
  ],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    EditAutoscalerPolicyStep1Component,
    EditAutoscalerPolicyStep2Component,
    EditAutoscalerPolicyStep3Component,
    EditAutoscalerPolicyStep4Component
  ]
})
export class EditAutoscalerPolicyComponent implements OnInit {

  parentUrl: string;
  applicationName$!: Observable<string>;
  isCreate = false;

  constructor(
    public applicationService: ApplicationService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
    this.isCreate = this.route.snapshot.queryParams.create;
    this.cdr.markForCheck();
  }

}
