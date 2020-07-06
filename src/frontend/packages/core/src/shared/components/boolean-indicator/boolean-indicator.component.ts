import { Component, Input } from '@angular/core';

export enum BooleanIndicatorType {
  enabledDisabled = 'enabled-disabled',
  lockedUnlocked = 'locked-unlocked',
  unlockedLocked = 'unlocked-locked',
  yesNo = 'yes-no',
  trueFalse = 'true-false',
  healthyUnhealthy = 'healthy-unhealthy',
  succeededFailed = 'success-failed',
  progressProgress = 'progress-progress'
}

interface IBooleanConfig {
  isTrue?: boolean;
  isUnknown?: boolean;
  inverse?: boolean;
  subtle?: boolean;
}

interface IBooleanOutput {
  icon: string;
  text: string;
  isUnknown?: boolean;
  isTrue?: boolean;
  subtle: boolean;
}

export type booleanStringType = 'True' | 'False' | 'Unknown';

@Component({
  selector: 'app-boolean-indicator',
  templateUrl: './boolean-indicator.component.html',
  styleUrls: ['./boolean-indicator.component.scss']
})
export class BooleanIndicatorComponent {
  public booleanOutput: IBooleanOutput;
  // Invert the text labels with the icons (No text for yes value and vice-versa)
  @Input() inverse = false;
  // Should we use a subtle display - this won't show the No option as danger (typically red)
  @Input() subtle = true;
  @Input() showText = true;

  private pType: BooleanIndicatorType;
  @Input()
  get type(): BooleanIndicatorType {
    return this.pType;
  }
  set type(type: BooleanIndicatorType) {
    this.pType = type;
    this.updateBooleanOutput();
  }

  private pIsTrue: boolean;
  @Input()
  get isTrue(): boolean {
    return this.pIsTrue;
  }
  set isTrue(isTrue: boolean) {
    this.pIsTrue = isTrue;
    this.updateBooleanOutput();
  }

  private updateBooleanOutput() {
    const isUnknown = typeof this.isTrue !== 'boolean';
    this.booleanOutput = this.getIconTextAndSeverity({
      isTrue: this.isTrue,
      isUnknown: isUnknown,
      inverse: this.inverse,
      subtle: this.subtle
    });
  }

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
    Unknown: 'help_outline',
    Progress: 'cached'
  };

  private getIconTextAndSeverity = (
    { isTrue = false, isUnknown = false, inverse = false, subtle = true }: IBooleanConfig
  ): IBooleanOutput => {
    if (isUnknown || !this.type) {
      return {
        icon: this.icons.Unknown,
        text: 'Unknown',
        isUnknown: true,
        subtle: true
      };
    }
    const text = this.getText({ isTrue, inverse });
    return {
      icon: this.icons[text],
      text,
      isTrue: inverse ? !isTrue : isTrue,
      subtle
    };
  }

  private getText = ({ isTrue = false, inverse = false }: IBooleanConfig): string => {
    const [enabledText, disabledText] = this.getTypeText(this.type);
    const value = inverse ? !isTrue : isTrue;
    return this.capitalizeFirstLetter(value ? enabledText : disabledText);
  }

  private getTypeText = (s: string) => s.split('-');

  private capitalizeFirstLetter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
}
