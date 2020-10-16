import { Observable, of as observableOf } from 'rxjs';
import { Chart } from '../models/chart';
import { ChartVersion } from '../models/chart-version';


const mockChart: Chart = {
  id: 'incubator/test',
  type: 'chart',
  links: [],
  attributes: {
    description: 'Testing the chart',
    home: 'helm.sh',
    keywords: ['artifactory'],
    maintainers: [
      {
        email: 'test@example.com',
        name: 'Test'
      }
    ],
    name: 'test',
    repo: {
      name: 'incubator',
      url: 'test'
    },
    icon: 'icon',
    sources: ['https://github.com/']
  },
  relationships: {
    latestChartVersion: {
      data: {
        app_version: '1.0',
        created: new Date('2017-02-13T04:33:57.218083521Z'),
        digest:
          'eba0c51d4bc5b88d84f83d8b2ba0c5e5a3aad8bc19875598198bdbb0b675f683',
        icons: [
          {
            name: '160x160-fit',
            path: '/assets/incubator/test/4.16.0/logo-160x160-fit.png'
          }
        ],
        readme: '/assets/incubator/test/4.16.0/README.md',
        urls: [
          'https://kubernetes-charts-incubator.storage.googleapis.com/test-4.16.0.tgz'
        ],
        version: '4.16.0'
      },
      links: {
        self: '/v1/charts/incubator/test/versions/4.16.0'
      }
    }
  }
};

const mockChartVersion: ChartVersion = {
  id: 'incubator/test',
  type: 'chart',
  attributes: {
    app_version: '1.0',
    created: new Date('2017-02-13T04:33:57.218083521Z'),
    digest:
      'eba0c51d4bc5b88d84f83d8b2ba0c5e5a3aad8bc19875598198bdbb0b675f683',
    icons: [
      {
        name: '160x160-fit',
        path: '/assets/incubator/test/4.16.0/logo-160x160-fit.png'
      }
    ],
    readme: '/assets/incubator/test/4.16.0/README.md',
    urls: [
      'https://kubernetes-charts-incubator.storage.googleapis.com/test-4.16.0.tgz'
    ],
    version: '4.16.0'
  },
  relationships: {
    chart: {
      data: mockChart.attributes,
      links: {
        self: '/v1/charts/incubator/test/versions/4.16.0'
      }
    }
  }
};

export class MockChartService {

  public getCharts() {
    return observableOf([]);
  }

  public getChart(): Observable<Chart> {
    return observableOf(mockChart);
  }

  public getChartReadme(): Observable<Response> {
    return observableOf({} as Response);
  }

  public getVersions(): Observable<ChartVersion[]> {
    return observableOf([]);
  }

  public getVersion(): Observable<ChartVersion> {
    return observableOf(mockChartVersion);
  }

  public searchCharts(): Observable<Chart[]> {
    return observableOf([]);
  }

  public getChartIconURL() {
    return null;
  }

}
