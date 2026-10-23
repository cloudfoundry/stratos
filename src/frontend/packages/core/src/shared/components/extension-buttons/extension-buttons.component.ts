import { ChangeDetectionStrategy, Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';
import { of } from 'rxjs';

import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
} from '../../../core/extension/extension-service';

@Component({
  selector: 'app-extension-buttons',
  templateUrl: './extension-buttons.component.html',
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

  readonly type = input<StratosActionType>();

  ngOnInit() {
    const type = this.type();
    if (!type) {
      return;
    }
    this.extensionActions = getActionsFromExtensions(type).map(value => ({
      ...value,
      visible$: value.visible$ || of(true)
    }));
  }
}
