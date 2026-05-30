import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { safeUnsubscribe, MetadataItemComponent, BooleanIndicatorComponent, SnackBarService } from '@stratosui/core';
import { CloudFoundrySpaceService } from '../../../../features/cf/services/cloud-foundry-space.service';

@Component({
  selector: 'app-card-cf-space-details',
  templateUrl: './card-cf-space-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MetadataItemComponent,
    BooleanIndicatorComponent
  ]
})
export class CardCfSpaceDetailsComponent implements OnDestroy {
  public cfSpaceService = inject(CloudFoundrySpaceService);
  private router = inject(Router);
  private snackBarService = inject(SnackBarService);

  allowSshStatus$: Observable<string>;
  quotaLinkSub!: Subscription;

  constructor() {
    this.allowSshStatus$ = this.cfSpaceService.allowSsh$.pipe(
      map(status => status === 'false' ? 'Disabled' : 'Enabled')
    );
  }

  goToOrgQuota() {
    this.quotaLinkSub = this.cfSpaceService.quotaLink$.subscribe(quotaLink => {
      this.router.navigate(quotaLink);
      this.snackBarService.showWithLink('You were switched to an organization', this.router.url, 'Return to space');
    });
  }

  ngOnDestroy() {
    safeUnsubscribe(this.quotaLinkSub);
  }
}
