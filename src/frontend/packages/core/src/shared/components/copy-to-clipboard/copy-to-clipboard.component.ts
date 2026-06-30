import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-copy-to-clipboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './copy-to-clipboard.component.html',
})
export class CopyToClipboardComponent {
  /**
   * Required hover text (tooltip) for the copy action.
   * Use **"Copy to clipboard"** unless there is a strong reason not to.
   */
  @Input({ required: true }) tooltip!: string;
  @Input() showSuccessText = true;
  @Input() text = '';

  // Show smaller icon
  @Input() compact = false;

  private defaultCopyState = 'not yet' as const;
  readonly didUserPressCopy = signal<'not yet' | 'yes and succeeded' | 'yes but failed' | 'yes and saw succeeded'>(this.defaultCopyState);

  async copyToClipboard(textToCopy: string) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.didUserPressCopy.set('yes and succeeded');
      await this.afterSomeSeconds();
      this.didUserPressCopy.set('yes and saw succeeded');
    } catch (err) {
      // * manual testing suggestion paste below in browser console to simulate a clipboard failure:
      // navigator.clipboard.writeText = async () => { throw new Error('Simulated clipboard failure') };
      this.didUserPressCopy.set('yes but failed'); 
      console.error('Failed to copy text. This might be due to security settings surrounding the clipboard API.', err);
    }
  }

  private afterSomeSeconds() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 700);
    });
  }

}

// * manual testing suggestion paste below in browser console to simulate a clipboard failure:
// navigator.clipboard.writeText = async () => { throw new Error('Simulated clipboard failure') };