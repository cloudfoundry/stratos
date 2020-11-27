package store

// ChartStore is the Helm Chart Store repository
type ChartStore interface {
	// This will add or update the given chart
	Save(chart ChartStoreRecord, batchID string) error

	// Delete chart versions for a given batch
	DeleteBatch(endpoint, chart, batchID string) error

	// Delete all charts for the given endpoint
	DeleteForEndpoint(endpoint string) error

	// RenameEndpoint renames an endpoint (==renames helm repository)
	RenameEndpoint(endpointID, name string) error

	// GetLatestCharts gets all of the latest charts
	GetLatestCharts() ([]*ChartStoreRecord, error)

	// Version is optional - empty means get latest
	GetChart(repo, name, version string) (*ChartStoreRecord, error)

	// Get Chart Versions
	GetChartVersions(repo, name string) ([]*ChartStoreRecord, error)

	// Get Endopoint IDs stored in the chart store
	GetEndpointIDs() ([]string, error)
}
