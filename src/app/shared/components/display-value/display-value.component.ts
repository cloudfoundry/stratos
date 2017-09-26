import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-display-value',
  templateUrl: './display-value.component.html',
  styleUrls: ['./display-value.component.scss']
})
export class DisplayValueComponent implements OnInit, AfterViewInit {

  @Input() label: string;
  @Input() value: string;

  @ViewChild('displayCustom') displayCustom: ElementRef;
  displayDefault: boolean;


  constructor() { }

  ngOnInit() {
  }

  // ngAfterContentInit() {
  //   // this.showDisplayDefault = this.displayDefault.nativeElement.children.length > 0;
  // }

  ngAfterViewInit() {
    this.displayDefault = this.displayCustom.nativeElement.children.length === 0;
  }

}
