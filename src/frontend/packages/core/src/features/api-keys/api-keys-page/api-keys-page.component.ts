import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';

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
export class ApiKeysPageComponent implements OnInit {

  public keyDetails = new Subject<string>();
  public keyDetails$ = this.keyDetails.asObservable();

  constructor(
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
  }

  addApiKey() {
    this.showDialog().pipe(first()).subscribe(key => {
      this.keyDetails.next(key);
    })
  }

  clearKeyDetails() {
    this.keyDetails.next();
  }

  private showDialog(): Observable<string> {
    // return of('TEST');
    return this.dialog.open(AddApiKeyDialogComponent, {
      disableClose: true,
    }).afterClosed().pipe(
      map(a => {
        console.log('RESULT: ', a);
        return 'FINISHED'
      })
    );
  }

}
