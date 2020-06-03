import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { AppState } from '../../../../../store/src/app-state';
import {
  getActionsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
} from '../../../core/extension/extension-service';

@Component({
  selector: 'app-extension-buttons',
  templateUrl: './extension-buttons.component.html',
  styleUrls: ['./extension-buttons.component.scss']
})
export class ExtensionButtonsComponent implements OnInit {

  public extensionActions: StratosActionMetadata[] = [];

  @Input() type: StratosActionType;

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
