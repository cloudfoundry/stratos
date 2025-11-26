import { CommonModule, AsyncPipe } from '@angular/common';
import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AnsiColors } from '@stratosui/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NoContentMessageComponent } from '../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';

import type { HelmRelease } from '../../../workload.types';
import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-notes-tab',
  templateUrl: './helm-release-notes-tab.component.html',
  styleUrls: ['./helm-release-notes-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    NoContentMessageComponent
  ]
})
export class HelmReleaseNotesTabComponent {

  public notes$: Observable<string>;

  private colorizer = new AnsiColors();  public helmReleaseHelper = inject(HelmReleaseHelperService);



  constructor() {


    this.notes$ = this.helmReleaseHelper.release$.pipe(
      map((release: HelmRelease) => {
        if (release?.info?.notes) {
          return this.colorizer.ansiColorsToHtml(release.info.notes);
        } else {
          return '';
        }
      })
    );


  }
}
