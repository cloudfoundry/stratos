import { Component, Input } from '@angular/core';

export enum BooleanIndicatorType {
  enabledDisabled = 'enabled-disabled',
  lockedUnlocked = 'locked-unlocked',
  unlockedLocked = 'unlocked-locked',
  yesNo = 'yes-no',
  trueFalse = 'true-false',
  healthyUnhealthy = 'healthy-unhealthy',
  succeededFailed = 'success-failed'
}


@Component({
  selector: 'app-boolean-indicator',
  templateUrl: './boolean-indicator.component.html',
  styleUrls: ['./boolean-indicator.component.scss']
})
export class BooleanIndicatorComponent {

  @Input() isTrue: boolean;
  @Input() type: BooleanIndicatorType;
  @Input() showText = true;

  // Should we use a subtle display - this won't show the No option as danger (typically red)
  @Input() subtle = true;

  // Invert the text labels with the icons (No text for yes value and vice-versa)
  @Input() inverse = false;

  private icons = {
    Yes: 'check_circle',
    Enabled: 'check_circle',
    Healthy: 'check_circle',
    True: 'check_circle',
    Succeeded: 'check_circle',
    Add: 'add_circle',
    No: 'highlight_off',
    Disabled: 'highlight_off',
    Unhealthy: 'highlight_off',
    Failed: 'remove_circle',
    False: 'highlight_off',
    Remove: 'remove_circle',
    Locked: 'lock_outline',
    Unlocked: 'lock_open',
  };

  getIcon = () => {
    return this.icons[this.getText(this.inverse)];
  }

  getText = (inverse = false): string => {
    const [enabledText, disabledText] = this.getTypeText(this.type);
    const value = inverse ? !this.isTrue : this.isTrue;
    return this.capitalizeFirstLetter(value ? enabledText : disabledText);
  }

  getTypeText = (s: string) => s.split('-');

  capitalizeFirstLetter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
}
