import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ApplicationService } from '../../../../application.service';

@Component({
  selector: 'app-auto-scaler-tab',
  templateUrl: './auto-scaler-tab.component.html',
  styleUrls: ['./auto-scaler-tab.component.scss']
})
export class AutoScalerTabComponent implements OnInit {

  srcUrl: any;

  constructor(private sanitizer: DomSanitizer, private applicationService: ApplicationService) {
    this.srcUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://scalingconsole.stage1.eu-gb.bluemix.net/apps/' + this.applicationService.appGuid);
    console.log("url", this.srcUrl)
  }

  ngOnInit() {
    console.log('cfGuid', this.applicationService.cfGuid)
    console.log('appGuid', this.applicationService.appGuid)
  }

}
