import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export enum BooleanIndicatorType {
  enabledDisabled = 'enabled-disabled',
  lockedUnlocked = 'locked-unlocked',
  unlockedLocked = 'unlocked-locked',
  yesNo = 'yes-no',
  trueFalse = 'true-false',
  healthyUnhealthy = 'healthy-unhealthy',
  // Value must split into the 'Succeeded'/'Failed' icon-map keys
  succeededFailed = 'succeeded-failed',
  progressProgress = 'progress-progress',
  addRemove = 'add-remove',
  // Inverted severity: 'No' is the positive/expected state (e.g. node NotReady conditions)
  noYes = 'no-yes'
}

// Accepts the enum or its string-literal form, so templates can write e.g. type="yes-no".
export type BooleanIndicatorTypeValue = BooleanIndicatorType | `${BooleanIndicatorType}`;

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
  standalone: true,
  imports: [
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooleanIndicatorComponent {
  // Invert the text labels with the icons (No text for yes value and vice-versa)
  readonly inverse = input(false);
  // Should we use a subtle display - this won't show the No option as danger (typically red)
  readonly subtle = input(true);

  readonly showText = input(true);

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

  readonly type = input<BooleanIndicatorTypeValue>();

  // undefined/null render the 'Unknown' indicator (see booleanOutput),
  // so callers can bind not-yet-loaded data, including `| async` streams.
  readonly isTrue = input<boolean | null>();

  readonly booleanOutput = computed<IBooleanOutput>(() => {
    const isTrue = this.isTrue();
    return this.getIconTextAndSeverity({
      isTrue: isTrue ?? undefined,
      isUnknown: typeof isTrue !== 'boolean',
      inverse: this.inverse(),
      subtle: this.subtle()
    });
  });

  private getIconTextAndSeverity = (
    { isTrue = false, isUnknown = false, inverse = false, subtle = true }: IBooleanConfig
  ): IBooleanOutput => {
    if (isUnknown || !this.type()) {
      return {
        icon: this.icons.Unknown,
        text: 'Unknown',
        isUnknown: true,
        subtle: true
      };
    }
    const text = this.getText({ isTrue, inverse });
    return {
      icon: (this.icons as any)[text],
      text,
      isTrue: inverse ? !isTrue : isTrue,
      subtle
    };
  };

  private getText = ({ isTrue = false, inverse = false }: IBooleanConfig): string => {
    const [enabledText, disabledText] = this.getTypeText(this.type() ?? '');
    const value = inverse ? !isTrue : isTrue;
    return this.capitalizeFirstLetter(value ? enabledText : disabledText);
  };

  private getTypeText = (s: string) => s.split('-');

  private capitalizeFirstLetter = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
}
