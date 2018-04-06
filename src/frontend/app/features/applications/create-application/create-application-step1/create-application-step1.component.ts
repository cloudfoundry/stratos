import { AfterContentInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { CfOrgSpaceDataService, CfOrgSpaceSelectMode } from '../../../../shared/data-services/cf-org-space-service.service';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SetCFDetails } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';


@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
  providers: [
    {
      provide: CfOrgSpaceDataService,
      useFactory: (store: Store<AppState>, paginationMonitorFactory: PaginationMonitorFactory) => {
        return new CfOrgSpaceDataService(store, paginationMonitorFactory, CfOrgSpaceSelectMode.ANY);
      },
      deps: [Store, PaginationMonitorFactory]
    }
  ],
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit {

  constructor(
    private store: Store<AppState>,
    public cfOrgSpaceService: CfOrgSpaceDataService
  ) { }

  cfValid$: Observable<boolean>;

  @ViewChild('cfForm')
  cfForm: NgForm;

  @Input('isRedeploy') isRedeploy = false;

  validate: Observable<boolean>;

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
  }

  ngAfterContentInit() {
    this.validate = this.cfForm.statusChanges.pipe(
      map(() => {
        return this.cfForm.valid || this.isRedeploy;
      })
    );
  }

}
