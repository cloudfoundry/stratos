import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-enumerate',
  templateUrl: './enumerate.component.html',
  styleUrls: ['./enumerate.component.scss']
})
export class EnumerateComponent {
  @Input('collection') collection: Observable<any[]>;
  @Input('labelPath') labelPath: string;
}
