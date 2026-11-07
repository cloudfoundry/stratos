import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
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

  toggle(): void {
    this.open.update(open => !open);
  }

  close(): void {
    this.open.set(false);
  }

  async copy(command: CliCommand): Promise<void> {
    const syntax = command.syntax(this.context());
    this.close();
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
    this.close();
  }
}
