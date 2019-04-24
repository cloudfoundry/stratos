package chartrepo

import (
	"bytes"
)

type ChartRepoDatastore interface {
	DeleteRepo(string) error

	// ImportCharts will import all charts - must be for same repo - and remove and charts not in the imported set
	ImportCharts([]Chart) error

	StoreChartIcon(Chart, bytes.Buffer) error

	StoreChartFiles(string, ChartFiles) error
}
