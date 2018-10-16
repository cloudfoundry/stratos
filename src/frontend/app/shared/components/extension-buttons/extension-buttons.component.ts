import { Component, Input, OnInit } from '@angular/core';
import { StratosActionMetadata, getActionsFromExtensions, StratosActionType } from '../../../core/extension/extension-service';
import { LoggerService } from '../../../core/logger.service';

@Component({
  selector: 'app-extension-buttons',
  templateUrl: './extension-buttons.component.html',
  styleUrls: ['./extension-buttons.component.scss']
})
export class ExtensionButtonsComponent implements OnInit {

  public extensionActions: StratosActionMetadata[] = [];

  @Input() type: StratosActionType;

  constructor(private logger: LoggerService) { }

  ngOnInit() {
    if (!StratosActionType[this.type]) {
      this.logger.warn('Extension Buttons: Unknown StratosActionType: ' + this.type);
    }
    this.extensionActions = getActionsFromExtensions(this.type);
  }
}
