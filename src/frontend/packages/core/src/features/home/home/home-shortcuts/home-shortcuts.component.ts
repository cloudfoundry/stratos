import { ChangeDetectionStrategy, Component, Input  } from '@angular/core';

import { RouterModule } from '@angular/router';

import { HomeCardShortcut } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-home-shortcuts',
  templateUrl: './home-shortcuts.component.html',
  styleUrls: ['./home-shortcuts.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    CustomIconComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeShortcutsComponent {

  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() shortcuts: HomeCardShortcut[] = [];

}
