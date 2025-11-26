import { AsyncPipe } from '@angular/common';
import {Component, Input, type OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CardWrapperComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '@stratosui/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { type AppChip, AppChipsComponent } from '../../../../../../../core/src/shared/components/chips/chips.component';
import { KubernetesNodeService } from '../../../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-tags-card',
  templateUrl: './kubernetes-node-tags-card.component.html',
  styleUrls: ['./kubernetes-node-tags-card.component.scss'],
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
  mode: string;

  @Input()
  title: string;

  chipTags$: Observable<AppChip[]>;  public kubeNodeService = inject(KubernetesNodeService);

  ngOnInit(): void {
    this.chipTags$ = this.kubeNodeService.nodeEntity$.pipe(
      map(node => this.getTags((node.metadata as unknown as Record<string, Record<string, string>>)[this.mode])),
    );
  }


  private getTags(tags: Record<string, string>): AppChip[] {
    const labelEntries = Object.entries(tags);
    return labelEntries.map(t => ({
      value: `${t[0]}:${t[1]}`
    }));
  }
}
