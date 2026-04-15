import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTooltipDirective } from '../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { TailwindDialogService } from '../../../shared/services/tailwind-dialog.service';
import { stratosEntityCatalog } from '@stratosui/store';
import { Observable, Subject } from 'rxjs';
import { take, defaultIfEmpty, map, startWith } from 'rxjs/operators';

import { ApiKeyListConfigService } from '../../../shared/components/list/list-types/apiKeys/apiKey-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { AddApiKeyDialogComponent } from '../add-api-key-dialog/add-api-key-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ListComponent } from '../../../shared/components/list/list.component';
import { NoContentMessageComponent } from '../../../shared/components/no-content-message/no-content-message.component';
import { ProductNameComponent } from '../../../shared/components/product-name.ccomponent';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-api-keys-page',
  templateUrl: './api-keys-page.component.html',
  styleUrls: ['./api-keys-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: ApiKeyListConfigService}], changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    CustomTooltipDirective,
    PageHeaderComponent,
    ListComponent,
    NoContentMessageComponent,
    ProductNameComponent
  ]
})
export class ApiKeysPageComponent {
  private dialog = inject(TailwindDialogService);


  public keyDetails = new Subject<string>();
  public keyDetails$ = this.keyDetails.asObservable();

  /* tslint:disable:ban-types  */
  // This is intentionally typed, property can be null and there's different logic associated with it
  public hasKeys$: Observable<boolean>;
  /* tslint:enable */

  constructor() {
    this.hasKeys$ = stratosEntityCatalog.apiKey.store.getPaginationService().entities$.pipe(
      map(entities => entities && !!entities.length),
      startWith(null),
    );
  }

  addApiKey() {
    this.showDialog().pipe(take(1), defaultIfEmpty(null)).subscribe(key => {
      if (key) { this.keyDetails.next(key); }
    });
  }

  clearKeyDetails() {
    this.keyDetails.next(null);
  }

  private showDialog(): Observable<string> {
    return this.dialog.open(AddApiKeyDialogComponent, {
      disableClose: true,
    }).afterClosed().pipe(
      map(newApiKey => {
        if (newApiKey && newApiKey.guid) {
          stratosEntityCatalog.apiKey.api.getMultiple();
          return newApiKey;
        }
        return null;
      })
    );
  }

}
