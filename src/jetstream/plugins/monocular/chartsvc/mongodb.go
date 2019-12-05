package chartsvc

import (
	//"bytes"
	"errors"
	"fmt"

	"github.com/globalsign/mgo/bson"
	"github.com/helm/monocular/chartsvc/models"
	"github.com/kubeapps/common/datastore"
)

// const (
// 	chartCollection       = "charts"
// 	chartFilesCollection  = "files"
// 	defaultTimeoutSeconds = 10
// 	additionalCAFile      = "/usr/local/share/ca-certificates/ca.crt"
// )

type MongoDBChartSvcDatastore struct {
	dbSession datastore.Session
}

// MongoDBChartSvcDatastore creates a new MongoDB data store
func NewMongoDBChartSvcDatastore(dbSession datastore.Session) (*MongoDBChartSvcDatastore, error) {
	return &MongoDBChartSvcDatastore{dbSession: dbSession}, nil
}

func (m *MongoDBChartSvcDatastore) ListRepositories() ([]string, error) {
	return nil, nil
}

func (m *MongoDBChartSvcDatastore) ListCharts() ([]*models.Chart, error) {
	db, closer := dbSession.DB()
	defer closer()
	var charts []*models.Chart
	err := db.C(chartCollection).Find(nil).Sort("name").All(&charts)
	return charts, err
}

func (m *MongoDBChartSvcDatastore) GetChart(chartID string) (models.Chart, error) {
	db, closer := dbSession.DB()
	defer closer()
	var chart models.Chart
	err := db.C(chartCollection).FindId(chartID).One(&chart)
	return chart, err
}

func (m *MongoDBChartSvcDatastore) GetChartVersion(chartID, version string) (models.Chart, error) {
	db, closer := dbSession.DB()
	defer closer()
	var chart models.Chart
	err := db.C(chartCollection).Find(bson.M{
		"_id":           chartID,
		"chartversions": bson.M{"$elemMatch": bson.M{"version": version}},
	}).Select(bson.M{
		"name": 1, "repo": 1, "description": 1, "home": 1, "keywords": 1, "maintainers": 1, "sources": 1,
		"chartversions.$": 1,
	}).One(&chart)
	return chart, err
}

func (m *MongoDBChartSvcDatastore) GetChartIcon(chartID string) ([]byte, error) {
	db, closer := dbSession.DB()
	defer closer()
	var chart models.Chart
	err := db.C(chartCollection).FindId(chartID).One(&chart)
	if err != nil {
		return nil, fmt.Errorf("No icon available for chart: %s", chartID)
	}

	if chart.RawIcon == nil {
		return nil, fmt.Errorf("No icon available for chart: %s", chartID)
	}

	return chart.RawIcon, nil
}

func (m *MongoDBChartSvcDatastore) GetChartVersionReadme(chartID, version string) ([]byte, error) {
	db, closer := dbSession.DB()
	defer closer()
	var files models.ChartFiles
	fileID := fmt.Sprintf("/%s-%s", chartID, version)
	if err := db.C(filesCollection).FindId(fileID).One(&files); err != nil {
		return nil, err
	}

	readme := []byte(files.Readme)
	return readme, nil
}

func (m *MongoDBChartSvcDatastore) GetChartVersionValuesYaml(chartID, version string) ([]byte, error) {
	return nil, errors.New("Not implemented")
}
