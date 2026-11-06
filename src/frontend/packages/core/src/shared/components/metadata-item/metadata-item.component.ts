import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
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

  @Input() public iconFont?: string;

  @Input() public label?: string;

  @Input() public tooltip?: string;

  // Are we editing?
  @Input() public edit?: boolean;

  // Does the item have a value to copy to the clipboard? = show the copy glyph
  @Input() public clipboardValue?: string;

  // Briefly swaps the copy glyph to a check_circle after a successful write.
  readonly copied = signal(false);

  copyToClipboard(): void {
    if (!this.clipboardValue) return;
    const text = this.clipboardValue;
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
