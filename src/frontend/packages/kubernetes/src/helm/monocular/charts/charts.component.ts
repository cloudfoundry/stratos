import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Chart } from '../shared/models/chart';
import { ChartsService } from '../shared/services/charts.service';
import { ConfigService } from '../shared/services/config.service';
import { ReposService } from '../shared/services/repos.service';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  viewProviders: [MatIconRegistry]
})
export class ChartsComponent implements OnInit {
  charts: Chart[] = [];
  orderedCharts: Chart[] = [];
  loading = true;
  searchTerm: string;
  searchTimeout: any;
  filtersOpen = false;

  // Default filters
  filters = [
    {
      title: 'Repository',
      onSelect: i => this.onSelectRepo(i),
      items: [{ title: 'All', value: 'all', selected: true }]
    },
    {
      title: 'Order By',
      onSelect: i => this.onSelectOrderBy(i),
      items: [
        { title: 'Name', value: 'name', selected: true },
        { title: 'Created At', value: 'created', selected: false }
      ]
    }
  ];

  // Order elements
  orderBy = 'name';

  // Repos
  repoName: string;

  constructor(
    private chartsService: ChartsService,
    private reposService: ReposService,
    private route: ActivatedRoute,
    private router: Router,
    private config: ConfigService,
    private mdIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.mdIconRegistry.addSvgIcon(
      'search',
      this.sanitizer.bypassSecurityTrustResourceUrl(`/assets/icons/search.svg`)
    );
    this.mdIconRegistry.addSvgIcon(
      'close',
      this.sanitizer.bypassSecurityTrustResourceUrl(`/assets/icons/close.svg`)
    );
    this.mdIconRegistry.addSvgIcon(
      'menu',
      this.sanitizer.bypassSecurityTrustResourceUrl(`/assets/icons/menu.svg`)
    );
    this.route.queryParams.forEach((params: Params) => {
      this.searchTerm = params.q ? params.q : undefined;
      if (this.searchTerm) {
        this.searchCharts();
      }
    });
    this.route.params.forEach((params: Params) => {
      this.repoName = params.repo ? params.repo : undefined;
      this.updateMetaTags();
      this.loadCharts();
      this.loadRepos();
    });
  }

  loadCharts(): void {
    this.chartsService.getCharts(this.repoName).subscribe(charts => {
      this.loading = false;
      this.charts = charts;
      if (!this.searchTerm) {
        this.orderedCharts = this.orderCharts(this.charts);
      }
    });
  }

  loadRepos(): void {
    this.reposService.getRepos().subscribe(repos => {
      // Ensure the "all" link is appended to the list of repos
      repos = [{ name: 'all', url: '' }, ...repos];
      this.filters[0].items = repos.map(r => ({
        title: r.name,
        value: r.name,
        selected: this.repoName ? r.name === this.repoName : r.name === 'all'
      }));
    });
  }

  onSelectRepo(index) {
    this.repoName = this.filters[0].items[index].value;
    this.filters[0].items = this.filters[0].items.map(r => {
      r.selected = r.value === this.repoName;
      return r;
    });
    this.router.navigate(
      ['/charts', this.repoName === 'all' ? '' : this.repoName],
      { replaceUrl: true }
    );
  }

  onSelectOrderBy(index) {
    this.orderBy = this.filters[1].items[index].value;
    this.filters[1].items = this.filters[1].items.map(o => {
      o.selected = o.value === this.orderBy;
      return o;
    });
    this.orderedCharts = this.orderCharts(this.orderedCharts);
  }

  searchChange(e) {
    this.searchTerm = e.target.value;
    clearTimeout(this.searchTimeout);
    if (!this.searchTerm) {
      return (this.orderedCharts = this.orderCharts(this.charts));
    }
    this.searchTimeout = setTimeout(() => this.searchCharts(), 1000);
  }

  searchCharts() {
    if (!this.searchTerm) {
      return false;
    }
    this.loading = true;
    this.chartsService
      .searchCharts(this.searchTerm, this.repoName)
      .subscribe(charts => {
        this.loading = false;
        this.orderedCharts = this.orderCharts(charts);
      });
  }

  // Sort charts
  orderCharts(charts): Chart[] {
    switch (this.orderBy) {
      case 'created': {
        return charts.sort(this.sortByCreated).reverse();
      }
      default: {
        return charts.sort((a, b) =>
          a.attributes.name.localeCompare(b.attributes.name)
        );
      }
    }
  }

  sortByCreated(a: Chart, b: Chart) {
    const aVersion = a.relationships.latestChartVersion.data;
    const bVersion = b.relationships.latestChartVersion.data;
    if (aVersion.created < bVersion.created) {
      return -1;
    } else if (aVersion.created > bVersion.created) {
      return 1;
    }
    return 0;
  }

  // TODO: See #150 - is this to be implemented?
  updateMetaTags(): void { }

  capitalize(input: string) {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }
}
