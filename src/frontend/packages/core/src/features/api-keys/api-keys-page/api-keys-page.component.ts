import { ChangeDetectionStrategy, Component, Signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import {
  SignalListComponent,
  SignalListConfig,
} from '@stratosui/core';
import { ApiKey } from '@stratosui/store';

import { ApiKeysDataService } from '../api-keys-data.service';
import {
  ApiKeysSignalConfigService,
  calendarDays,
  keyExpiry,
  timeOfDay,
} from '../../../shared/signal-list-configs/apiKeys/api-keys-signal-config.service';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { CreateApiKeyData, CreateApiKeyStepperComponent } from '../create-api-key-stepper/create-api-key-stepper.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NoContentMessageComponent } from '../../../shared/components/no-content-message/no-content-message.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

const DAY_MS = 24 * 60 * 60 * 1000;
// An expired key keeps its banner for this many days.
const BANNER_DAYS_AFTER = 7;

interface KeyBanner {
  guid: string;
  comment: string;
  expired: boolean;
  text: string;
}

@Component({
  selector: 'app-api-keys-page',
  templateUrl: './api-keys-page.component.html',
  providers: [ApiKeysSignalConfigService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    CustomTooltipDirective,
    PageHeaderComponent,
    SignalListComponent,
    NoContentMessageComponent,
  ],
})
export class ApiKeysPageComponent {
  private dialog = inject(TailwindDialogService);
  private dataService = inject(ApiKeysDataService);
  private listConfigService = inject(ApiKeysSignalConfigService);

  // null until the first fetch settles so the empty-state and the list
  // both stay hidden during initial load. After fetch: true if there
  // are keys, false otherwise — matches the legacy hasKeys$ tri-state.
  public hasKeys: Signal<boolean | null> = computed(() => {
    if (this.dataService.lastFetched() === null) return null;
    return this.dataService.apiKeys().length > 0;
  });

  public readonly listConfig: SignalListConfig<ApiKey>;

  constructor() {
    this.listConfig = this.listConfigService.buildConfig();
    void this.dataService.load();
  }

  // One row per key that is about to expire (less than a day left) or
  // expired up to a week ago; older expired keys stay in the list only.
  public banners: Signal<KeyBanner[]> = computed(() => {
    const now = new Date();
    const out: KeyBanner[] = [];
    for (const k of this.dataService.apiKeys()) {
      const { state, days } = keyExpiry(k, now);
      const at = k.expires_at ? timeOfDay(new Date(k.expires_at)) : '';
      if (state === 'soon' && new Date(k.expires_at!).getTime() - now.getTime() < DAY_MS) {
        const day = calendarDays(now, new Date(k.expires_at!)) === 0 ? 'today' : 'tomorrow';
        out.push({
          guid: k.guid, comment: k.comment, expired: false,
          text: `"${k.comment}" expires ${day} at ${at}. Create a replacement and update the script that uses it.`,
        });
      } else if (state === 'expired' && days <= BANNER_DAYS_AFTER) {
        const when = days === 0 ? 'today' : `${days} ${days === 1 ? 'day' : 'days'} ago`;
        out.push({
          guid: k.guid, comment: k.comment, expired: true,
          text: `"${k.comment}" expired ${when} at ${at}. Requests that use it are refused.`,
        });
      }
    }
    return out;
  });

  async addApiKey(comment?: string): Promise<void> {
    const data: CreateApiKeyData = comment === undefined ? {} : { comment };
    await firstValueFrom(
      this.dialog.open(CreateApiKeyStepperComponent, { data, disableClose: true, panelClass: 'p-6' }).afterClosed(),
    );
  }

  createReplacement(comment: string): Promise<void> {
    return this.addApiKey(comment);
  }
}
