import { ChangeDetectionStrategy, Component, Input, type OnInit } from '@angular/core';


@Component({
  selector: 'app-dialog-error',
  templateUrl: './dialog-error.component.html',
  styleUrls: ['./dialog-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class DialogErrorComponent implements OnInit {

  @Input() message!: string;

  @Input() show!: boolean;

  ngOnInit() {
    // Component initialization
  }

}
