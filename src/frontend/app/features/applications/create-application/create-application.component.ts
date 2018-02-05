import { Component, OnInit } from '@angular/core';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { selectPaginationState } from '../../../store/selectors/pagination.selectors';
import { ApplicationSchema } from '../../../store/actions/application.actions';
import { CfAppsDataSource } from '../../../shared/data-sources/cf-apps-data-source';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss'],
  providers: [CfOrgSpaceDataService],
})
export class CreateApplicationComponent implements OnInit, OnDestroy {

  paginationStateSub: Subscription;
  constructor(private store: Store<AppState>, public cfOrgSpaceService: CfOrgSpaceDataService) { }

  ngOnInit() {
        // We will auto select endpoint/org/space that have been selected on the app wall.
        const appWallPaginationState = this.store.select(selectPaginationState(ApplicationSchema.key, CfAppsDataSource.paginationKey));
        this.paginationStateSub = appWallPaginationState.filter(pag => !!pag).first().do(pag => {
          this.cfOrgSpaceService.cf.select.next(pag.clientPagination.filter.items.cf);
          this.cfOrgSpaceService.org.select.next(pag.clientPagination.filter.items.org);
          this.cfOrgSpaceService.space.select.next(pag.clientPagination.filter.items.space);
        }).subscribe();
  }
  ngOnDestroy(): void {
    this.paginationStateSub.unsubscribe();
      }

}
