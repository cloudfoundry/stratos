import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';

@Component({
  selector: 'app-stratos-title',
  templateUrl: './stratos-title.component.html',
  styleUrls: ['./stratos-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class StratosTitleComponent {
  private branding = inject(StratosBrandingService);

  // Optional title
  @Input() title?: string;

  // Theme-related signals (computed from theme service)
  public themeTitle = computed(() =>
    this.branding.theme()?.branding?.companyName ||
    this.branding.theme()?.branding?.loginTitle ||
    'Stratos'
  );

  public themeSubtitle = computed(() =>
    this.branding.theme()?.branding?.loginSubtitle || ''
  );

  public themeLogo = computed(() =>
    this.branding.theme()?.branding?.logo || '/core/assets/logo.png'
  );
}
