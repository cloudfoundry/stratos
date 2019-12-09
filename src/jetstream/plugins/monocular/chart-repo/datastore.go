package chartrepo

import (
	"bytes"

	"github.com/helm/monocular/chartrepo/common"
)

type ChartRepoDatastore interface {
	DeleteRepo(string) error

	// ImportCharts will import all charts - must be for same repo - and remove and charts not in the imported set
	ImportCharts([]common.Chart) error

	StoreChartIcon(common.Chart, bytes.Buffer) error

	StoreChartFiles(string, common.ChartFiles) error
}
