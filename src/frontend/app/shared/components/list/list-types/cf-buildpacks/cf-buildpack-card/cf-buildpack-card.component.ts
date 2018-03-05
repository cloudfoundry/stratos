import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../../../store/types/api.types';
import { IBuildpack } from '../../../../../../core/cf-api.types';

@Component({
  selector: 'app-cf-buildpack-card',
  templateUrl: './cf-buildpack-card.component.html',
  styleUrls: ['./cf-buildpack-card.component.scss']
})
export class CfBuildpackCardComponent implements OnInit {

  @Input('row') row: APIResource<IBuildpack>;
  constructor() { }

  ngOnInit() {
  }

}
