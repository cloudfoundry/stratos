import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { take,  } from 'rxjs/operators';

import {
  ListComponent,
  ListConfig,
  NoContentMessageComponent,
} from '@stratosui/core';
import {
  CfAppRoutesListConfigService,
} from '../../../../../../../shared/components/list/list-types/app-route/cf-app-routes-list-config.service';
import { CfOrgSpaceDataService } from '../../../../../../../shared/data-services/cf-org-space-service.service';
import { ApplicationService } from '../../../../../application.service';

@Component({
  selector: 'app-routes-tab',
  templateUrl: './routes-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListComponent,
    NoContentMessageComponent
],
  providers: [
    DatePipe,
    {
      provide: ListConfig,
      useFactory: () => new CfAppRoutesListConfigService(),
      deps: []
    },
    CfOrgSpaceDataService
  ]
})
export class RoutesTabComponent implements OnInit {
  private appService = inject(ApplicationService);

  paginationSubscription!: Subscription;

  ngOnInit() {
    this.appService.orgDomains$.pipe(
      take(1)
    ).subscribe();
  }

}
