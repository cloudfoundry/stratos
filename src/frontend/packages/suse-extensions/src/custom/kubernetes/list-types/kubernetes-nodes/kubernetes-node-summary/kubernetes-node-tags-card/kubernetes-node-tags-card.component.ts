import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-tags-card',
  templateUrl: './kubernetes-node-tags-card.component.html',
  styleUrls: ['./kubernetes-node-tags-card.component.scss']
})
export class KubernetesNodeTagsCardComponent implements OnInit {


  @Input()
  mode: string;

  @Input()
  title: string;

  chipTags$: Observable<AppChip[]>;

  constructor(
    public kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {
    this.chipTags$ = this.kubeNodeService.nodeEntity$.pipe(
      map(node => this.getTags(node.metadata[this.mode])),
    );
  }


  private getTags(tags: {}) {
    const labelEntries = Object.entries(tags);
    return labelEntries.map(t => ({
      value: `${t[0]}:${t[1]}`
    }));
  }
}
