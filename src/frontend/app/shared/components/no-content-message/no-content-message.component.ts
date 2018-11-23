import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-no-content-message',
  templateUrl: './no-content-message.component.html',
  styleUrls: ['./no-content-message.component.scss']
})
export class NoContentMessageComponent implements OnInit {

  @Input() icon: string;
  @Input() iconFont: string;
  @Input() firstLine: string;
  @Input() secondLine: {
    link?: string;
    linkText?: string;
    text: string;
  };
  @Input() toolbarLink: {
    text: string;
  };

  constructor() { }

  ngOnInit() {
  }

}
