import { AfterContentInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { SetCFDetails } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';


@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit {

  @Input('isServiceInstanceMode')
  isServiceInstanceMode: boolean;
  constructor(
    private store: Store<AppState>,
    public cfOrgSpaceService: CfOrgSpaceDataService
  ) { }

  cfValid$: Observable<boolean>;

  @ViewChild('cfForm')
  cfForm: NgForm;

  @Input('isRedeploy') isRedeploy = false;

  validate: Observable<boolean>;

  @Input('stepperText')
  stepperText = 'Select a Cloud Foundry instance, organization and space for the app.';

  onNext = () => {
    this.store.dispatch(new SetCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return Observable.of({ success: true });
  }

  ngOnInit() {
    if (this.isRedeploy) {
      this.stepperText = 'Review the Cloud Foundry instance, organization and space for the app.';
    }
    if (this.isServiceInstanceMode) {
      this.stepperText = 'Select an organization and space for the service instance.';
    }
  }

  ngAfterContentInit() {
    this.validate = this.cfForm.statusChanges.pipe(
      map(() => {
        return this.cfForm.valid || this.isRedeploy;
      })
    );
  }

}
