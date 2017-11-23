import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-no-content-message',
  templateUrl: './no-content-message.component.html',
  styleUrls: ['./no-content-message.component.scss']
})
export class NoContentMessageComponent implements OnInit {

  @Input('icon') icon: string;
  @Input('firstLine') firstLine: string;
  @Input('secondLine') secondLine: {
    link: string;
    linkText: string;
    text; string;
  };

  constructor() { }

  ngOnInit() {
  }

}
