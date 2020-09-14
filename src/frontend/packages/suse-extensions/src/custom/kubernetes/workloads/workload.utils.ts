import { ChartVersion } from '../../helm/monocular/shared/models/chart-version';

// Get first URL for a Chart or return empty string if none
export function getFirstChartUrl(chart: ChartVersion): string {
  if (chart && chart.attributes && chart.attributes.urls && chart.attributes.urls.length > 0) {
    return chart.attributes.urls[0];
  }
  return '';
}
