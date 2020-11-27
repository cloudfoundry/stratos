import { Component, Input } from '@angular/core';

import { HomeCardShortcut } from '../../../../../../store/src/entity-catalog/entity-catalog.types';

@Component({
  selector: 'app-home-shortcuts',
  templateUrl: './home-shortcuts.component.html',
  styleUrls: ['./home-shortcuts.component.scss']
})
export class HomeShortcutsComponent {

  @Input() shortcuts: HomeCardShortcut[];

}
