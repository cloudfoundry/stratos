import { AfterContentInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { SetCFDetails } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { CfAppsDataSource } from '../../../../shared/data-sources/cf-apps-data-source';


@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit {

  constructor(private store: Store<AppState>, public cfOrgSpaceService: CfOrgSpaceDataService) { }

  cfValid$: Observable<boolean>;

  @ViewChild('cfForm')
  cfForm: NgForm;

  validate: Observable<boolean>;

  onNext = () => {
    this.store.dispatch(new SetCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return Observable.of({ success: true });
  }

  ngOnInit() {

  }

  ngAfterContentInit() {
    this.validate = this.cfForm.statusChanges
      .map(() => {
        return this.cfForm.valid;
      });
  }

}
