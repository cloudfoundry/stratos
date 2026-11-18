import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { AnsiColors } from '@stratosui/core';

import { NoContentMessageComponent } from '../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';

import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-notes-tab',
  templateUrl: './helm-release-notes-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NoContentMessageComponent
  ]
})
export class HelmReleaseNotesTabComponent {

  private colorizer = new AnsiColors();
  public helmReleaseHelper = inject(HelmReleaseHelperService);

  readonly notes = computed(() => {
    const notes = this.helmReleaseHelper.release()?.info?.notes;
    return notes ? this.colorizer.ansiColorsToHtml(notes) : '';
  });
}
