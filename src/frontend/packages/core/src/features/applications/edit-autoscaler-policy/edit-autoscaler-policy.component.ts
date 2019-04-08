import { Component } from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-edit-autoscaler-policy',
  templateUrl: './edit-autoscaler-policy.component.html',
  styleUrls: ['./edit-autoscaler-policy.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyComponent {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;

  constructor(
    public applicationService: ApplicationService,
  ) {
  }
}
