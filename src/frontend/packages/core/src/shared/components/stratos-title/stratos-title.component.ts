import { CommonModule } from '@angular/common';
import { Component, Input, computed } from '@angular/core';
import { StratosThemeService } from '../../../../../theme/theme.service';

@Component({
  selector: 'app-stratos-title',
  templateUrl: './stratos-title.component.html',
  styleUrls: ['./stratos-title.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class StratosTitleComponent {

  // Optional title
  @Input() title: string;

  // Theme-related signals (computed from theme service)
  public themeTitle = computed(() =>
    this.themeService.theme()?.branding?.companyName ||
    this.themeService.theme()?.branding?.loginTitle ||
    'Stratos'
  );

  public themeSubtitle = computed(() =>
    this.themeService.theme()?.branding?.loginSubtitle || ''
  );

  public themeLogo = computed(() =>
    this.themeService.theme()?.branding?.logo || '/core/assets/logo.png'
  );

  constructor(private themeService: StratosThemeService) {}
}
