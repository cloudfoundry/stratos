import { ChangeDetectionStrategy, Component, Input, signal, input } from '@angular/core';
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

  @Input() icon!: string;

  public readonly iconFont = input<string>();

  @Input() public label?: string;

  @Input() public tooltip?: string;

  // Are we editing?
  public readonly edit = input<boolean>();

  // Does the item have a value to copy to the clipboard? = show the copy glyph
  public readonly clipboardValue = input<string>();

  // Briefly swaps the copy glyph to a check_circle after a successful write.
  readonly copied = signal(false);

  copyToClipboard(): void {
    const clipboardValue = this.clipboardValue();
    if (!clipboardValue) return;
    const text = clipboardValue;
    const done = () => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1200);
    };
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done, () => done());
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
    try { document.execCommand('copy'); } catch { /* ignore */ }
    document.body.removeChild(ta);
    done();
  }
}
