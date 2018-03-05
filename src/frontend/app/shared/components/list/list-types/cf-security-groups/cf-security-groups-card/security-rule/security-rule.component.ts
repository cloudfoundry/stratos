import { Component, OnInit, Input } from '@angular/core';
import { IRule, IRuleType } from '../../../../../../../core/cf-api.types';

@Component({
  selector: 'app-security-rule',
  templateUrl: './security-rule.component.html',
  styleUrls: ['./security-rule.component.scss']
})
export class SecurityRuleComponent implements OnInit {

  @Input('rule') rule: IRule;
  constructor() { }

  ngOnInit() {
  }

  getRuleString = () => {

    let destination = this.rule.destination;

    if (this.rule.protocol === IRuleType.tcp || this.rule.protocol === IRuleType.udp) {
      destination = `${this.rule.destination}:${this.rule.ports}`;
    }
    return destination;
  }

}
