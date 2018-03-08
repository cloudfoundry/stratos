import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../../../store/types/api.types';
import { IStack } from '../../../../../../core/cf-api.types';

@Component({
  selector: 'app-cf-stacks-card',
  templateUrl: './cf-stacks-card.component.html',
  styleUrls: ['./cf-stacks-card.component.scss']
})
export class CfStacksCardComponent implements OnInit {

  @Input('row') row: APIResource<IStack>;
  constructor() { }

  ngOnInit() {
  }

}
