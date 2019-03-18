import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-enumerate',
  templateUrl: './enumerate.component.html',
  styleUrls: ['./enumerate.component.scss']
})
export class EnumerateComponent {
  @Input() collection: Observable<any[]>;
  @Input() labelPath: string;
}
