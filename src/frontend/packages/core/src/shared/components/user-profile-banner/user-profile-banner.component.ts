import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-user-profile-banner',
  templateUrl: './user-profile-banner.component.html',
  styleUrls: ['./user-profile-banner.component.scss']
})
export class UserProfileBannerComponent implements OnInit {

  private uName: string;

  @Input()
  get name(): string { return this.uName; }
  set name(name: string) {
    this.uName = name.trim();
  }

  @Input() email: string;
  @Input() username: string;

  constructor() { }

  ngOnInit() {
  }

}
