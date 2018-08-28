import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-user-profile-banner',
  templateUrl: './user-profile-banner.component.html',
  styleUrls: ['./user-profile-banner.component.scss']
})
export class UserProfileBannerComponent implements OnInit {

  @Input() name: string;
  @Input() email: string;

  constructor() { }

  ngOnInit() {
  }

}
