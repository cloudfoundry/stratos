import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '../../../shared/services/tailwind-material-replacements';
import { stratosEntityCatalog } from '@stratosui/store';
import { Observable, Subject } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { ApiKeyListConfigService } from '../../../shared/components/list/list-types/apiKeys/apiKey-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { AddApiKeyDialogComponent } from '../add-api-key-dialog/add-api-key-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ListComponent } from '../../../shared/components/list/list.component';
import { NoContentMessageComponent } from '../../../shared/components/no-content-message/no-content-message.component';
import { ProductNameComponent } from '../../../shared/components/product-name.ccomponent';

@Component({
selector: 'app-api-keys-page',
  templateUrl: './api-keys-page.component.html',
  styleUrls: ['./api-keys-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: ApiKeyListConfigService,
  }],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    ListComponent,
    NoContentMessageComponent,
    ProductNameComponent
  ]
})
export class ApiKeysPageComponent {

  public keyDetails = new Subject<string>();
  public keyDetails$ = this.keyDetails.asObservable();

  /* tslint:disable:ban-types  */
  // This is intentionally typed, property can be null and there's different logic associated with it
  public hasKeys$: Observable<Boolean>;
  /* tslint:enable */

  constructor(
    private dialog: MatDialog,
  ) {
    this.hasKeys$ = stratosEntityCatalog.apiKey.store.getPaginationService().entities$.pipe(
      map(entities => entities && !!entities.length),
      startWith(null),
    );
  }

  addApiKey() {
    this.showDialog().pipe(first()).subscribe(key => {
      this.keyDetails.next(key);
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
