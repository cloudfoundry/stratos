import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HomeCardShortcut } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';

@Component({
  selector: 'app-home-shortcuts',
  templateUrl: './home-shortcuts.component.html',
  styleUrls: ['./home-shortcuts.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent
  ]
})
export class HomeShortcutsComponent {

  @Input() shortcuts: HomeCardShortcut[];

}
