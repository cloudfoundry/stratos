import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { SetCFDetails } from '../../../store/actions/create-applications-page.actions';
import { Observable } from 'rxjs/Observable';
import { StoreCFSettings } from '../../../store/actions/deploy-applications.actions';

@Component({
  selector: 'app-deploy-application',
  templateUrl: './deploy-application.component.html',
  styleUrls: ['./deploy-application.component.scss'],

})
export class DeployApplicationComponent {

  constructor(private store: Store<AppState>, public cfOrgSpaceService: CfOrgSpaceDataService) { }

  onNext = () => {
    this.store.dispatch(new StoreCFSettings({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return Observable.of({ success: true });
  }
}
