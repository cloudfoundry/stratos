import { Component, OnInit, Input } from '@angular/core';
import { split } from 'ts-node/dist';

export enum BooleanIndicatorType {
  enabledDisabled = 'enabled-disabled',
  lockedUnlocked = 'locked-unlocked',
  unlockedLocked = 'unlocked-locked',
  yesNo = 'yes-no',
  trueFalse = 'true-false'
}


@Component({
  selector: 'app-boolean-indicator',
  templateUrl: './boolean-indicator.component.html',
  styleUrls: ['./boolean-indicator.component.scss']
})
export class BooleanIndicatorComponent implements OnInit {

  @Input('isTrue') isTrue: boolean;
  @Input('type') type: BooleanIndicatorType;

  private icons = {
    Yes: 'check_circle',
    Enabled: 'check_circle',
    True: 'check_circle',
    No: 'highlight_off',
    Disabled: 'highlight_off',
    False: 'highlight_off',
    Locked: 'lock_outline',
    Unlocked: 'lock_open',
  };
  constructor() { }

  ngOnInit() {
  }

  getIcon = () => {
    return this.icons[this.getText()];
  }

  getText = (): string => {
    const [enabledText, disabledText] = this.getTypeText(this.type);
    return this.capitalizeFirstLetter(this.isTrue ? enabledText : disabledText);
  }

  getTypeText = (s) => s.split('-');

  capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
}
