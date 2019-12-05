package chartsvc

import (
	//"bytes"
	"github.com/helm/monocular/chartsvc/models"
)

type ChartSvcDatastore interface {
	ListRepositories() ([]string, error)
	ListCharts() ([]*models.Chart, error)
	GetChart(chartID string) (models.Chart, error)
	GetChartVersion(chartID, version string) (models.Chart, error)
	GetChartIcon(chartID string) ([]byte, error)
	GetChartVersionReadme(chartID, version string) ([]byte, error)
	GetChartVersionValuesYaml(chartID, version string) ([]byte, error)
}
