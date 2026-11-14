import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomTooltipDirective, TailwindSnackBarService } from '@stratosui/core';

import { CliCommand, CliCommandNames } from '../cli-info/cli-commands';

// The CF CLI menu of a tab: the cf commands that match the tab, each copied
// to the clipboard when chosen, and CF CLI All, which opens the level's
// CLI Info page. The menu never runs a command.
@Component({
  selector: 'app-cli-menu',
  templateUrl: './cli-menu.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CustomTooltipDirective],
})
export class CliMenuComponent {
  private host = inject(ElementRef<HTMLElement>);
  private snackBar = inject(TailwindSnackBarService);

  readonly commands = input.required<CliCommand[]>();
  readonly context = input.required<CliCommandNames>();
  readonly allLink = input.required<string | any[]>();

  readonly open = signal(false);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  toggle(): void {
    this.open.update(open => !open);
  }

  // returnFocus: the focused item leaves the page with the menu, so focus
  // goes back to the menu button instead of falling to the page body.
  close(returnFocus = false): void {
    this.open.set(false);
    if (returnFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  async copy(command: CliCommand): Promise<void> {
    const syntax = command.syntax(this.context());
    this.close(true);
    try {
      await navigator.clipboard.writeText(syntax);
      this.snackBar.show(`Copied ${syntax}`, 'Close');
    } catch {
      this.snackBar.show(`Could not copy ${syntax}`, 'Close');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close(true);
    }
  }
}
