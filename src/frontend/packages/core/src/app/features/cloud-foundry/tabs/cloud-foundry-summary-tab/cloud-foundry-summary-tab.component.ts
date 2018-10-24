import { Component, OnInit } from '@angular/core';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { goToAppWall } from '../../cf.helpers';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';

@Component({
  selector: 'app-cloud-foundry-summary-tab',
  templateUrl: './cloud-foundry-summary-tab.component.html',
  styleUrls: ['./cloud-foundry-summary-tab.component.scss']
})
export class CloudFoundrySummaryTabComponent {
  appLink: Function;

  constructor(private store: Store<AppState>, public cfEndpointService: CloudFoundryEndpointService) {
    this.appLink = () => {
      goToAppWall(store, cfEndpointService.cfGuid);
    };
  }
}
