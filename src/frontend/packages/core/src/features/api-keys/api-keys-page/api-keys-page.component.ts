import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { stratosEntityCatalog } from '@stratosui/store';
import { Observable, Subject } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

import { ApiKeyListConfigService } from '../../../shared/components/list/list-types/apiKeys/apiKey-list-config.service';
import { ListConfig } from '../../../shared/components/list/list.component.types';
import { AddApiKeyDialogComponent } from '../add-api-key-dialog/add-api-key-dialog.component';

@Component({
  selector: 'app-api-keys-page',
  templateUrl: './api-keys-page.component.html',
  styleUrls: ['./api-keys-page.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: ApiKeyListConfigService,
  }]
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
    this.keyDetails.next();
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
