import { Observable } from 'rxjs/Rx';
import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  styleUrls: ['./display-value.component.scss']
})
export class DisplayValueComponent {

  @Input() label: string;
  @Input() value: string;

  constructor() { }
}
