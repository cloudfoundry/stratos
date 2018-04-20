import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../store/types/api.types';
import { IRoute } from '../../../../core/cf-api.types';

@Component({
  selector: 'app-delete-app-routes',
  templateUrl: './delete-app-routes.component.html',
  styleUrls: ['./delete-app-routes.component.scss']
})
export class DeleteAppRoutesComponent implements OnInit {

  @Input('routes')
  public routes: APIResource<IRoute>[];


  constructor() { }

  ngOnInit() {
  }

}
