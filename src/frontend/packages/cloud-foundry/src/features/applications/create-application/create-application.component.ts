import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, type OnDestroy, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Subscription } from 'rxjs';
import { filter, first, tap } from 'rxjs/operators';
import type { GeneralEntityAppState } from '@stratosui/store';

import { PageHeaderComponent, StepComponent, SteppersComponent } from '@stratosui/core';
import type { CFAppState } from '@stratosui/cloud-foundry';
import { applicationEntityType } from '../../../cf-entity-types';
import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CreateApplicationStep1Component } from '../../../shared/components/create-application/create-application-step1/create-application-step1.component';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { selectCfPaginationState } from '../../../store/selectors/pagination.selectors';
import { CreateApplicationStep2Component } from './create-application-step2/create-application-step2.component';
import { CreateApplicationStep3Component } from './create-application-step3/create-application-step3.component';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss'],
  providers: [CfOrgSpaceDataService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    CreateApplicationStep1Component,
    CreateApplicationStep2Component,
    CreateApplicationStep3Component
  ]
})
export class CreateApplicationComponent implements OnInit, OnDestroy {

  paginationStateSub?: Subscription;

  private store = inject(Store<GeneralEntityAppState>);
  public cfOrgSpaceService = inject(CfOrgSpaceDataService);

  ngOnInit() {
    // We will auto select endpoint/org/space that have been selected on the app wall.
    this.cfOrgSpaceService.enableAutoSelectors();
    // FIXME: This has been broken for a while (setting cf will clear org + space after org and space has been set)
    // With new tools (set initial/enable auto) this should be easier to fix
    const appWallPaginationState = this.store.select(selectCfPaginationState(applicationEntityType, CfAppsDataSource.paginationKey));
    this.paginationStateSub = appWallPaginationState.pipe(filter(pag => !!pag), first(), tap(pag => {
      const { cf, org, space } = pag.clientPagination.filter.items as { cf?: string; org?: string; space?: string };
      if (cf) {
        this.cfOrgSpaceService.cf.select.next(cf);
      }
      if (cf && org) {
        this.cfOrgSpaceService.org.select.next(org);
      }
      if (cf && org && space) {
        this.cfOrgSpaceService.space.select.next(space);
      }
    })).subscribe();
  }
  ngOnDestroy(): void {
    this.paginationStateSub?.unsubscribe();
  }

}
