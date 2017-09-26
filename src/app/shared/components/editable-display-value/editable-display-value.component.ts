import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-editable-display-value',
  templateUrl: './editable-display-value.component.html',
  styleUrls: ['./editable-display-value.component.scss']
})
export class EditableDisplayValueComponent implements OnInit, AfterViewInit {

  @Input() edit: boolean;
  @Input() label: string;
  @Input() value: any;

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

