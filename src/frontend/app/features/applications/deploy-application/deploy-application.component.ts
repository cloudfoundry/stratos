import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { SetCFDetails } from '../../../store/actions/create-applications-page.actions';
import { StoreCFSettings } from '../../../store/actions/deploy-applications.actions';
import { selectNewAppCFDetails } from '../../../store/selectors/create-application.selectors';
import { selectCfDetails } from '../../../store/selectors/deploy-application.selector';
import { filter, tap, take, first } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Observable } from 'rxjs/Observable';
import { selectPaginationState } from '../../../store/selectors/pagination.selectors';
import { ApplicationSchema } from '../../../store/actions/application.actions';
import { CfAppsDataSource } from '../../../shared/data-sources/cf-apps-data-source';
import { ActivatedRoute } from '@angular/router';
import { RouterNav } from '../../../store/actions/router.actions';

@Component({
  selector: 'app-deploy-application',
  templateUrl: './deploy-application.component.html',
  styleUrls: ['./deploy-application.component.scss'],
  providers: [CfOrgSpaceDataService]
})
export class DeployApplicationComponent implements OnInit, OnDestroy {

  initCfOrgSpaceService: Subscription[] = [];

  constructor (
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private activatedRoute: ActivatedRoute
  ) {}

  onNext = () => {
    this.store.dispatch(new StoreCFSettings({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return Observable.of({ success: true });
  }

  ngOnDestroy(): void {
    this.initCfOrgSpaceService.forEach(p => p.unsubscribe());
  }

  ngOnInit(): void {

    const isRedeploy = this.activatedRoute.snapshot.queryParams['redeploy'];

    if (isRedeploy) {
      this.initCfOrgSpaceService.push(this.store.select(selectCfDetails).pipe(
        filter(p => !!p),
        tap(p => {
          this.cfOrgSpaceService.cf.select.next(p.cloudFoundry);
          this.cfOrgSpaceService.org.select.next(p.org);
          this.cfOrgSpaceService.space.select.next(p.space);
        })
      ).subscribe());
      // In case user has specified the query param manually
      this.initCfOrgSpaceService.push(this.store.select(selectCfDetails).pipe(
        filter(p => !p),
        tap(p => {
            this.store.dispatch(new RouterNav({path: ['applications', 'deploy'] }));
        })
      ).subscribe());
    } else {
      this.initCfOrgSpaceService.push(this.store.select(selectPaginationState(ApplicationSchema.key, CfAppsDataSource.paginationKey)).pipe(
        filter((pag) => !!pag),
        tap(pag => {
          this.cfOrgSpaceService.cf.select.next(pag.clientPagination.filter.items.cf);
          this.cfOrgSpaceService.org.select.next(pag.clientPagination.filter.items.org);
          this.cfOrgSpaceService.space.select.next(pag.clientPagination.filter.items.space);
        })
      ).subscribe());
    }
  }
}

