import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-card-progress-overlay',
  templateUrl: './card-progress-overlay.component.html',
  styleUrls: ['./card-progress-overlay.component.scss']
})
export class CardProgressOverlayComponent {

  @Input() label: string;

  @Input() busy: Observable<boolean>;

}
