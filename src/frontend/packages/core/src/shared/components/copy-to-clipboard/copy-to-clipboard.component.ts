import { DOCUMENT, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';

@Component({
  selector: 'app-copy-to-clipboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './copy-to-clipboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CopyToClipboardComponent implements OnInit {
  copySuccessful = false;
  copySuccessWait = false;
  canCopy = false;
  private document: Document;

  @Input() tooltip!: string;
  @Input() showSuccessText = true;
  @Input() text = '';

  // Show smaller icon
  @Input() compact = false;

  constructor() {
    const document = inject<Document>(DOCUMENT);

    this.document = document;
  }

  ngOnInit() {
    // Show the button if EITHER clipboard mechanism is available. Gating solely
    // on the deprecated queryCommandSupported hid the button entirely in
    // browsers that have dropped it, even though the modern async Clipboard API
    // still works — one way "the copy button stopped working".
    this.canCopy = this.clipboardAvailable();
  }

  async copyToClipboard(event: MouseEvent | null = null): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    const copied = await this.writeToClipboard(this.text || '');
    this.copySuccessful = copied;
    if (copied) {
      this.copySuccessWait = true;
      setTimeout(() => this.copySuccessWait = false, 2000);
    }
  }

  private clipboardAvailable(): boolean {
    if (this.asyncClipboardAvailable()) {
      return true;
    }
    try {
      return this.document.queryCommandSupported('copy');
    } catch {
      return false;
    }
  }

  private asyncClipboardAvailable(): boolean {
    const nav = this.document.defaultView?.navigator;
    return typeof nav?.clipboard?.writeText === 'function';
  }

  // Prefer the modern async Clipboard API (matches service-keys / metadata-item
  // / page-header, which already use it); fall back to the legacy execCommand
  // textarea for older browsers or non-secure contexts where it's unavailable.
  private async writeToClipboard(text: string): Promise<boolean> {
    if (this.asyncClipboardAvailable()) {
      try {
        await this.document.defaultView!.navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fall through to the legacy path
      }
    }
    return this.legacyCopy(text);
  }

  private legacyCopy(text: string): boolean {
    const textArea = this.document.createElement('textarea');

    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    textArea.value = text;

    this.document.body.appendChild(textArea);
    textArea.select();

    let copied = false;
    try {
      copied = this.document.execCommand('copy');
    } catch (_err) {
      console.warn('Failed to copy to clipboard');
    }

    this.document.body.removeChild(textArea);
    return copied;
  }

}
