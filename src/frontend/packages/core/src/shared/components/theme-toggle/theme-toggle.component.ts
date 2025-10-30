
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StratosThemeService, ThemeMode } from '../../../../../theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
  standalone: true,
  imports: []
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  currentMode: ThemeMode = 'system';
  private destroy$ = new Subject<void>();

  constructor(private themeService: StratosThemeService) {}

  ngOnInit() {
    // Subscribe to theme mode changes
    this.themeService.themeMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode: ThemeMode) => {
        this.currentMode = mode;
      });

    // Subscribe to actual dark/light state
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  setMode(mode: ThemeMode) {
    this.themeService.setThemeMode(mode);
  }

  getIcon(): string {
    return this.isDarkMode ? 'moon' : 'sun';
  }

  getLabel(): string {
    if (this.currentMode === 'system') {
      return 'System';
    }
    return this.isDarkMode ? 'Dark' : 'Light';
  }
}
