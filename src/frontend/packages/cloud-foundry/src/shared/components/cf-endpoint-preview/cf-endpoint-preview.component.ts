import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { CFAppState } from '../../../cf-app-state';
import { goToAppWall } from '../../../features/cloud-foundry/cf.helpers';
import { CloudFoundryEndpointService } from '../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cf-endpoint-preview-component',
  templateUrl: './cf-endpoint-preview.component.html',
  styleUrls: ['./cf-endpoint-preview.component.scss']
})
export class CfEndpointPreviewComponent implements PreviewableComponent {

  title = null;
  detailsLoading$: Observable<boolean>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<CFAppState>) {
  }

  appLink() {
    goToAppWall(this.store, this.cfEndpointService.cfGuid);
  }

  setProps(props: { [key: string]: any }) {
    this.title = props.title;

    this.cfEndpointService.initialize(props.cfGuid);

    this.detailsLoading$ = combineLatest([
      // Wait for the apps to have been fetched, this will determine if multiple small cards are shown or now
      this.cfEndpointService.appsPagObs.fetchingEntities$.pipe(
        filter(loading => !loading)
      ),
    ]).pipe(
      map(() => false),
      startWith(true)
    );
  }
}
