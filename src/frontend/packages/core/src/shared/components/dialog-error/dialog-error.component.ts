import { ChangeDetectionStrategy, Component, OnInit, input } from '@angular/core';


@Component({
  selector: 'app-dialog-error',
  templateUrl: './dialog-error.component.html',
  styleUrls: ['./dialog-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class DialogErrorComponent implements OnInit {

  constructor() { }

  readonly message = input.required<string>();

  readonly show = input.required<boolean>();

  ngOnInit() {
  }

}
