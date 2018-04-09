import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-upgrade-page',
  templateUrl: './upgrade-page.component.html',
  styleUrls: ['./upgrade-page.component.scss']
})
export class UpgradePageComponent implements OnInit {

  constructor(private Meta: Meta) { }

  ngOnInit() {
    // Ugly meta-refresh to force recheck periodically every 20 seconds
    this.Meta.addTag({ 'http-Equiv': 'refresh', content: '20;/' });
  }
}
