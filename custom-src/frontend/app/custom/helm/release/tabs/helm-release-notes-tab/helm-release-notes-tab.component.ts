import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { AnsiColors } from '../../../../../shared/components/log-viewer/ansi-colors';

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
        if (release.info.status.notes) {
          return this.colorizer.ansiColorsToHtml(release.info.status.notes);
        } else {
          return '';
        }
      })
    );
  }
}
