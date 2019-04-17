import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { StratosAction, StratosActionType } from '../../../core/extension/extension-service';


@StratosAction({
  type: StratosActionType.Endpoints,
  label: 'Demo Helper',
  link: 'demoHelper',
  icon: 'tv',
  visible: (store: Store<AppState>) => store.select('auth').pipe(
    map(auth => auth.sessionData.plugins && auth.sessionData.plugins.demo)
  ),
})
@Component({
  selector: 'app-demo-helper',
  templateUrl: './demo-helper.component.html',
  styleUrls: ['./demo-helper.component.scss']
})
export class DemoHelperComponent {

  constructor(
    private httpClient: HttpClient,
  ) { }

  public demo(action: string) {
    const url = `/pp/v1/demo/endpoints/${action}`;
    this.httpClient.post(url, null, {}).subscribe(d => {
      window.location.assign('/endpoints');
    });
  }
}
