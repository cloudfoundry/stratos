import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-values-tab',
  templateUrl: './helm-release-values-tab.component.html',
  styleUrls: ['./helm-release-values-tab.component.scss']
})
export class HelmReleaseValuesTabComponent {

  public values$: Observable<string>;

  public viewType = 'user';

  constructor(public helmReleaseHelper: HelmReleaseHelperService) {

    this.values$ = helmReleaseHelper.release$.pipe(
      map(release => release.chart.values)
    );
  }

  private hidePasswords(values: string): string {
    // TODO: See #150 - It's a PITA but this should be done in the back end
    let mask = values.replace(new RegExp('(PASSWORD: [a-zA-Z0-9_\-]*)', 'gm'), 'PASSWORD: **********');
    mask = mask.replace(new RegExp('(password: [a-zA-Z0-9_\-]*)', 'gm'), 'password: **********');
    mask = mask.replace(new RegExp('(SECRET: [a-zA-Z0-9_\-]*)', 'gm'), 'SECRET: **********');
    mask = mask.replace(new RegExp('(secret: [a-zA-Z0-9_\-]*)', 'gm'), 'secret: **********');
    return mask;
  }
}
