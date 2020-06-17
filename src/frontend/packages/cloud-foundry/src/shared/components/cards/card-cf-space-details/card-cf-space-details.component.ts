import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  CloudFoundrySpaceService,
} from '../../../../../../cloud-foundry/src/features/cloud-foundry/services/cloud-foundry-space.service';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';

@Component({
  selector: 'app-card-cf-space-details',
  templateUrl: './card-cf-space-details.component.html',
  styleUrls: ['./card-cf-space-details.component.scss']
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
      this.snackBarService.showReturn('You were switched to an organization', this.router.url, 'Return to space');
    });
  }

  ngOnDestroy() {
    safeUnsubscribe(this.quotaLinkSub);
  }
}
