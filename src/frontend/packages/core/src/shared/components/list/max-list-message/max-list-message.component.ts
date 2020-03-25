import { Component, EventEmitter, Input, Output } from '@angular/core';

import { NoContentMessageLine } from '../../no-content-message/no-content-message.component';
import { ITableTextMaxed } from '../list-table/table.types';

@Component({
  selector: 'app-max-list-message',
  templateUrl: './max-list-message.component.html',
  styleUrls: ['./max-list-message.component.scss']
})
export class MaxListMessageComponent {

  private pConfig: ITableTextMaxed = {
    icon: 'apps',
    firstLine: 'There are a lot of entities to fetch'
  };

  @Input()
  set config(config: ITableTextMaxed) {
    if (!config) {
      return;
    }
    this.pConfig = {
      icon: config.icon || this.pConfig.icon,
      iconFont: config.iconFont || this.pConfig.iconFont,
      firstLine: config.firstLine || this.pConfig.firstLine,
      filterLine: config.filterLine,
    };
    this.otherLines = [];
    if (this.config.filterLine) {
      this.otherLines.push(
        { text: this.config.filterLine },
        { text: 'or' }
      );
    }
  }
  get config(): ITableTextMaxed {
    return this.pConfig;
  }


  @Output() showAllAfterMax = new EventEmitter();
  @Input() count = 0;

  otherLines: NoContentMessageLine[];

  showAll() {
    this.showAllAfterMax.emit();
  }
}
