import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dialog-error',
  templateUrl: './dialog-error.component.html',
  styleUrls: ['./dialog-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogErrorComponent implements OnInit {

  constructor() { }

  @Input() message: string;

  @Input() show: boolean;

  ngOnInit() {
  }

}
