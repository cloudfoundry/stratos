
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
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

  toggleTheme() {
    this.branding.toggleTheme();
  }

  setMode(mode: ThemeMode) {
    this.branding.setThemeMode(mode);
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
