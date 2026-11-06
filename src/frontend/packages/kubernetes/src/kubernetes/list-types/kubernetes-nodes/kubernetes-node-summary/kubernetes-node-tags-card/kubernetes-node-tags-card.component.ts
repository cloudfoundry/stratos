import { AsyncPipe } from '@angular/common';
import {Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardWrapperComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '@stratosui/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppChip, AppChipsComponent } from '../../../../../../../core/src/shared/components/chips/chips.component';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-tags-card',
  templateUrl: './kubernetes-node-tags-card.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    AppChipsComponent
  ]
})
export class KubernetesNodeTagsCardComponent implements OnInit {


  @Input()
  mode!: string; // strict: required @Input, always bound by the parent template

  @Input()
  title!: string; // strict: required @Input, always bound by the parent template

  chipTags$!: Observable<AppChip[]>;  public kubeNodeService = inject(KubernetesNodeService); // strict: assigned in ngOnInit before the template reads it

  ngOnInit(): void {
    this.chipTags$ = this.kubeNodeService.nodeEntity$.pipe(
      map(node => this.getTags((node.metadata as any)[this.mode])),
    );
  }


  private getTags(tags: Record<string, any>): AppChip[] {
    const labelEntries = Object.entries(tags);
    return labelEntries.map(t => ({
      value: `${t[0]}:${t[1]}`
    }));
  }
}
