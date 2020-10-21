import { Component, OnInit } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/shared/services/application.service';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

@Component({
  selector: 'app-edit-autoscaler-policy',
  templateUrl: './edit-autoscaler-policy.component.html',
  styleUrls: ['./edit-autoscaler-policy.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
    EditAutoscalerPolicyService
  ]
})
export class EditAutoscalerPolicyComponent implements OnInit {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  applicationName$: Observable<string>;
  isCreate = false;

  constructor(
    public applicationService: ApplicationService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
    this.isCreate = this.route.snapshot.queryParams.create;
  }

}
