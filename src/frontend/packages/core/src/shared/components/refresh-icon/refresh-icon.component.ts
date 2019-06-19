import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'refresh-icon',
  templateUrl: './refresh-icon.component.html',
  styleUrls: ['./refresh-icon.component.scss']
})
export class RefreshIconComponent {

  @Input()
  public isRefreshing$: Observable<boolean>;

  constructor() {
  }

}
