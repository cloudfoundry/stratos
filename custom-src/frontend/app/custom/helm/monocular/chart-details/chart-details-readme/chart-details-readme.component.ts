import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as markdown from 'marked';
import { Chart } from '../../shared/models/chart';
import { ChartsService } from '../../shared/services/charts.service';
import { ChartVersion } from '../../shared/models/chart-version';

@Component({
  selector: 'app-chart-details-readme',
  templateUrl: './chart-details-readme.component.html',
  styleUrls: ['./chart-details-readme.component.scss']
})
export class ChartDetailsReadmeComponent implements OnChanges {
  @Input() chart: Chart;
  @Input() currentVersion: ChartVersion;

  loading: boolean = true;
  readmeContent: string;

  constructor(private chartsService: ChartsService) {}

  // Detect if input changed
  ngOnChanges(changes: SimpleChanges) {
    this.getReadme();
  }

  // TODO. This should not require loading the specific version and then the readme
  getReadme(): void {
    if (!this.currentVersion) return;
    this.chartsService.getChartReadme(this.currentVersion).subscribe(resp => {
      this.loading = false;

      // Ensure links in the readme open in a new tab
      const renderer = new markdown.Renderer();
      renderer.link = function(href, title, text) {
        const link = markdown.Renderer.prototype.link.call(this, href, title, text);
        return link.replace('<a','<a target="_blank" ');
      };
      this.readmeContent = markdown(resp.text(), {
        renderer: renderer
      });
    }, (error) => {
      this.loading = false;
      if (error.status === 404) {
        this.readmeContent = '<h1>No Readme available for this chart</h1>';
      } else {
        this.readmeContent = '<h1>An error occrred retrieving Readme</h1>';
      }
    });
  }
}
