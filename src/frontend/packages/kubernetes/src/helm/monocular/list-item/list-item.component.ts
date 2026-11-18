import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomTooltipDirective } from '@stratosui/core';

import { Chart } from '../shared/models/chart';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    CustomTooltipDirective,
  ]
})
export class ListItemComponent {

  readonly height = input('default');
  // Both Artifact Hub and a classic helm repository are connected
  readonly artifactHubAndHelmRepoTypes = input(false);
  readonly chart = input<Chart>();

  public readonly detailUrl = input<string>();

  // Only show if we have artifact hub registered, there's other helm repo's also registered and this chart is from artifact hub
  protected readonly showArtifactHub = computed(() =>
    this.artifactHubAndHelmRepoTypes() && !!this.chart()?.monocularEndpointId
  );
}
