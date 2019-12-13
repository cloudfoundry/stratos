import { Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { CloudFoundryEndpointService } from '../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import {
  CloudFoundryOrganizationService,
} from '../../../features/cloud-foundry/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../features/cloud-foundry/services/cloud-foundry-space.service';

@Component({
  selector: 'app-space-preview-component',
  templateUrl: './space-preview.component.html',
  styleUrls: ['./space-preview.component.scss']
})
export class SpacePreviewComponent implements PreviewableComponent {

  title = null;
  detailsLoading$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private cfOrgService: CloudFoundryOrganizationService,
    public cfSpaceService: CloudFoundrySpaceService) {
  }

  setProps(props: { [key: string]: any }) {
    this.title = props.title;

    this.cfEndpointService.initialize(props.cfGuid);
    this.cfOrgService.initialize(props.cfGuid, props.orgGuid);
    this.cfSpaceService.initialize(props.cfGuid, props.orgGuid, props.guid);

    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      this.cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
      this.cfSpaceService.userProvidedServiceInstancesCount$
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
