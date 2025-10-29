import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { BooleanIndicatorComponent } from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { CloudFoundrySpaceService } from '../../../../features/cf/services/cloud-foundry-space.service';

@Component({
  selector: 'app-card-cf-space-details',
  templateUrl: './card-cf-space-details.component.html',
  styleUrls: ['./card-cf-space-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MetadataItemComponent,
    BooleanIndicatorComponent
  ]
})
export class CardCfSpaceDetailsComponent implements OnDestroy {
  allowSshStatus$: Observable<string>;
  quotaLinkSub: Subscription;

  constructor(
    public cfSpaceService: CloudFoundrySpaceService,
    private store: Store<AppState>,
    private router: Router,
    private snackBarService: SnackBarService
  ) {
    this.allowSshStatus$ = cfSpaceService.allowSsh$.pipe(
      map(status => status === 'false' ? 'Disabled' : 'Enabled')
    );
  }

  goToOrgQuota() {
    this.quotaLinkSub = this.cfSpaceService.quotaLink$.subscribe(quotaLink => {
      this.store.dispatch(new RouterNav({ path: quotaLink }));
      this.snackBarService.showWithLink('You were switched to an organization', this.router.url, 'Return to space');
    });
  }

  ngOnDestroy() {
    safeUnsubscribe(this.quotaLinkSub);
  }
}
