import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AnsiColors } from '../../../../../shared/components/log-viewer/ansi-colors';
import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-notes-tab',
  templateUrl: './helm-release-notes-tab.component.html',
  styleUrls: ['./helm-release-notes-tab.component.scss']
})
export class HelmReleaseNotesTabComponent {

  public notes$: Observable<string>;

  private colorizer = new AnsiColors();

  constructor(public helmReleaseHelper: HelmReleaseHelperService) {

    this.notes$ = helmReleaseHelper.release$.pipe(
      map(release => {
        if (release.info.notes) {
          return this.colorizer.ansiColorsToHtml(release.info.notes);
        } else {
          return '';
        }
      })
    );
  }
}
