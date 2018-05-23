import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-recent-entities',
  templateUrl: './recent-entities.component.html',
  styleUrls: ['./recent-entities.component.scss']
})
export class RecentEntitiesComponent implements OnInit {

  @Input('entityName')
  entityName = '';

  @Input('entityList')
  entityList: Observable<any[]>;

  constructor() {
  }

  ngOnInit() {
  }

}
