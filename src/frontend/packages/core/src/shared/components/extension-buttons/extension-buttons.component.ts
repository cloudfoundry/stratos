import { ChangeDetectionStrategy, Component, Input, type OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';
import { of } from 'rxjs';

import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';
import {
  getActionsFromExtensions,
  type StratosActionMetadata,
  type StratosActionType,
} from '../../../core/extension/extension-service';

@Component({
  selector: 'app-extension-buttons',
  templateUrl: './extension-buttons.component.html',
  styleUrls: ['./extension-buttons.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    CustomTooltipDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExtensionButtonsComponent implements OnInit {

  public extensionActions: StratosActionMetadata[] = [];

  @Input() type!: StratosActionType;

  constructor(
    private store: Store<AppState>
  ) { }

  ngOnInit() {
    this.extensionActions = getActionsFromExtensions(this.type).map(value => ({
      ...value,
      visible$: value.visible$ || value.visible ? value.visible(this.store) : of(true)
    }));
  }
}
