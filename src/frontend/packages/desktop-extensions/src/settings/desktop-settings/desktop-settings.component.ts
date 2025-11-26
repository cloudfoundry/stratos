import { Component } from '@angular/core';
import { CardComponent, PageHeaderComponent, ProfileSettingsComponent, ProfileSettingsTypes } from '@stratosui/core';

@Component({
  selector: 'app-desktop-settings',
  templateUrl: './desktop-settings.component.html',
  styleUrls: ['./desktop-settings.component.scss'],
  standalone: true,
  imports: [
    PageHeaderComponent,
    CardComponent,
    ProfileSettingsComponent
  ]
})
export class DesktopSettingsComponent {

  public settings: { [settingName: string]: boolean, } = {
    [ProfileSettingsTypes.POLLING]: true,
    [ProfileSettingsTypes.THEME]: true,
    [ProfileSettingsTypes.STORAGE]: true,
  };

}
