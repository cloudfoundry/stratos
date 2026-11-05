import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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

  readonly shortcuts = input<HomeCardShortcut[]>([]);

}
