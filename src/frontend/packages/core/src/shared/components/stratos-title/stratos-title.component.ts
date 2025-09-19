import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StratosThemeService } from '../../../../../theme/theme.service';
import { StratosTheme } from '../../../../../theme/theme.config';

@Component({
selector: 'app-stratos-title',
  templateUrl: './stratos-title.component.html',
  styleUrls: ['./stratos-title.component.scss'],
  standalone: false
})
export class StratosTitleComponent implements OnInit {

  // Optional title
  @Input() title: string;
  
  public themeTitle$: Observable<string>;
  public themeSubtitle$: Observable<string>;
  public themeLogo$: Observable<string>;

  constructor(private themeService: StratosThemeService) {}

  ngOnInit() {
    // Show company name as primary title, fallback to loginTitle, then default
    this.themeTitle$ = this.themeService.theme$.pipe(
      map((theme: StratosTheme) => 
        theme?.branding?.companyName || 
        theme?.branding?.loginTitle || 
        'Stratos'
      )
    );
    
    this.themeSubtitle$ = this.themeService.theme$.pipe(
      map((theme: StratosTheme) => theme?.branding?.loginSubtitle || '')
    );
    
    this.themeLogo$ = this.themeService.theme$.pipe(
      map((theme: StratosTheme) => theme?.branding?.logo || '/core/assets/logo.png')
    );
  }
}
