
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { StratosThemeService, type ThemeMode } from '../../../../../theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class ThemeToggleComponent {
  private themeService = inject(StratosThemeService);

  isDarkMode = computed(() => this.themeService.isDarkMode());
  currentMode = computed(() => this.themeService.themeMode());

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setMode(mode: ThemeMode) {
    this.themeService.setThemeMode(mode);
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
