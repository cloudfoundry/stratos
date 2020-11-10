import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-show-hide-button',
  templateUrl: './show-hide-button.component.html',
  styleUrls: ['./show-hide-button.component.scss']
})
export class ShowHideButtonComponent {

  private pShow = false;

  @Output()
  changed = new EventEmitter<boolean>();

  @Input()
  get show(): boolean {
    return this.pShow;
  }
  set show(state: boolean) {
    this.pShow = state;
    this.changed.emit(this.pShow);
  }

}
