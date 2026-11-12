import { DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';

import { MetadataItemComponent, BooleanIndicatorComponent, TailwindSnackBarService } from '@stratosui/core';
import { CloudFoundrySpaceService } from '../../../../features/cf/services/cloud-foundry-space.service';

@Component({
  selector: 'app-card-cf-space-details',
  templateUrl: './card-cf-space-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    DatePipe,
    RouterModule,
    MetadataItemComponent,
    BooleanIndicatorComponent
  ]
})
export class CardCfSpaceDetailsComponent {
  public cfSpaceService = inject(CloudFoundrySpaceService);
  private router = inject(Router);
  private snackBarService = inject(TailwindSnackBarService);

  // The space's own quota, and the quota in effect (the org's when the space
  // has none).
  readonly spaceQuota = toSignal(this.cfSpaceService.spaceQuotaDefinition$, { initialValue: null });
  readonly quota = toSignal(this.cfSpaceService.quotaDefinition$, { initialValue: null });
  readonly spaceQuotaLink = [
    '/cloud-foundry', this.cfSpaceService.cfGuid,
    'organizations', this.cfSpaceService.orgGuid,
    'spaces', this.cfSpaceService.spaceGuid, 'space-quota',
  ];
  readonly allowSshStatus = computed(() => {
    const space = this.cfSpaceService.spaceDataService.space();
    return space ? (space.allowSsh ? 'Enabled' : 'Disabled') : null;
  });

  goToOrgQuota() {
    this.router.navigate(['/cloud-foundry', this.cfSpaceService.cfGuid, 'organizations', this.cfSpaceService.orgGuid, 'quota']);
    this.snackBarService.showWithLink('You were switched to an organization', this.router.url, 'Return to space');
  }
}
