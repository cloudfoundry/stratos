import { ChangeDetectionStrategy, Component, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import {
  CardContentComponent,
  CardHeaderComponent,
  CardWrapperComponent,
  SignalListComponent,
  SignalListConfig,
} from '@stratosui/core';
import { ApiKey } from '@stratosui/store';

import { ApiKeysDataService } from '../api-keys-data.service';
import {
  ApiKeysSignalConfigService,
} from '../../../shared/signal-list-configs/apiKeys/api-keys-signal-config.service';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { AddApiKeyDialogComponent } from '../add-api-key-dialog/add-api-key-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NoContentMessageComponent } from '../../../shared/components/no-content-message/no-content-message.component';
import { ProductNameComponent } from '../../../shared/components/product-name.ccomponent';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

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
    ProductNameComponent,
    CardWrapperComponent,
    CardHeaderComponent,
    CardContentComponent,
  ],
})
export class ApiKeysPageComponent {
  private dialog = inject(TailwindDialogService);
  private dataService = inject(ApiKeysDataService);
  private listConfigService = inject(ApiKeysSignalConfigService);

  public keyDetails: WritableSignal<ApiKey | null> = signal(null);

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

  async addApiKey(): Promise<void> {
    const newKey = await firstValueFrom(
      this.dialog.open(AddApiKeyDialogComponent, { disableClose: true }).afterClosed(),
    );
    if (newKey) {
      this.keyDetails.set(newKey);
    }
  }

  clearKeyDetails(): void {
    this.keyDetails.set(null);
  }
}
