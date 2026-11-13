import { ChangeDetectionStrategy, Component, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';

import { CustomIconComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-metadata-item',
  templateUrl: './metadata-item.component.html',
  styleUrls: ['./metadata-item.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    CustomTooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataItemComponent {

  readonly icon = input<string>();

  public readonly iconFont = input<string>();

  public readonly label = input<string>();

  public readonly tooltip = input<string>();

  // Are we editing?
  public readonly edit = input<boolean>();

  // Does the item have a value to copy to the clipboard? = show the copy glyph
  public readonly clipboardValue = input<string>();

  // How the last copy went, for a short while: 'copied' swaps the glyph to
  // a check_circle; a live region says either outcome.
  readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  copyToClipboard(): void {
    const clipboardValue = this.clipboardValue();
    if (!clipboardValue) return;
    const text = clipboardValue;
    const show = (state: 'copied' | 'failed') => {
      this.copyState.set(state);
      setTimeout(() => this.copyState.set('idle'), 1200);
    };
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => show('copied'), () => show('failed'));
        return;
      }
    } catch {
      // Fall through to legacy execCommand path.
    }
    // Legacy fallback for non-secure-context (http://localhost edge cases).
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    document.body.removeChild(ta);
    show(ok ? 'copied' : 'failed');
  }
}
