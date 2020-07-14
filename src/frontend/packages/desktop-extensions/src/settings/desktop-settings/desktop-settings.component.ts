import { Component } from '@angular/core';
import { ProfileSettingsTypes } from '@stratosui/core';

@Component({
  selector: 'app-desktop-settings',
  templateUrl: './desktop-settings.component.html',
  styleUrls: ['./desktop-settings.component.scss']
})
export class DesktopSettingsComponent {

  public settings: { [settingName: string]: boolean } = {
    [ProfileSettingsTypes.POLLING]: true,
    [ProfileSettingsTypes.THEME]: true,
  }

}
