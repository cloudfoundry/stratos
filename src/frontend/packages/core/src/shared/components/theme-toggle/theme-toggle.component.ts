
import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { StratosBrandingService, ThemeMode } from '../../../../../theme/stratos-branding.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class ThemeToggleComponent {
  private branding = inject(StratosBrandingService);

  isDarkMode = computed(() => this.branding.isDarkMode());
  currentMode = computed(() => this.branding.themeMode());
  // Empty until the mode is changed here: the toggle is drawn in every page
  // header, and a status region that holds text when drawn says it on each
  // page change.
  readonly announcement = signal('');

  toggleTheme() {
    this.branding.toggleTheme();
    this.announce();
  }

  setMode(mode: ThemeMode) {
    this.branding.setThemeMode(mode);
    this.announce();
  }

  private announce() {
    this.announcement.set(this.isDarkMode() ? 'Dark mode activated' : 'Light mode activated');
  }

  getIcon(): string {
    return this.isDarkMode() ? 'moon' : 'sun';
  }

  getLabel(): string {
    if (this.currentMode() === 'system') {
      return 'System';
    }
    return this.isDarkMode() ? 'Dark' : 'Light';
  }
}
