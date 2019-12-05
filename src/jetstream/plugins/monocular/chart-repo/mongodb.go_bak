package chartrepo

import (
	"bytes"
	"github.com/globalsign/mgo/bson"
	"github.com/kubeapps/common/datastore"
)

// const (
// 	chartCollection       = "charts"
// 	chartFilesCollection  = "files"
// 	defaultTimeoutSeconds = 10
// 	additionalCAFile      = "/usr/local/share/ca-certificates/ca.crt"
// )

type MongoDBChartRepoDatastore struct {
	dbSession datastore.Session
}

// NewMongoDBChartRepoDatastore creates a new MongoDB data store
func NewMongoDBChartRepoDatastore(dbSession datastore.Session) (*MongoDBChartRepoDatastore, error) {
	return &MongoDBChartRepoDatastore{dbSession: dbSession}, nil
}

func (m *MongoDBChartRepoDatastore) DeleteRepo(repoName string) error {
	db, closer := m.dbSession.DB()
	defer closer()
	_, err := db.C(chartCollection).RemoveAll(bson.M{
		"repo.name": repoName,
	})
	if err != nil {
		return err
	}

	_, err = db.C(chartFilesCollection).RemoveAll(bson.M{
		"repo.name": repoName,
	})
	return err
}

func (m *MongoDBChartRepoDatastore) ImportCharts(charts []Chart) error {
	var pairs []interface{}
	var chartIDs []string
	for _, c := range charts {
		chartIDs = append(chartIDs, c.ID)
		// charts to upsert - pair of selector, chart
		pairs = append(pairs, bson.M{"_id": c.ID}, c)
	}

	db, closer := m.dbSession.DB()
	defer closer()
	bulk := db.C(chartCollection).Bulk()

	// Upsert pairs of selectors, charts
	bulk.Upsert(pairs...)

	// Remove charts no longer existing in index
	bulk.RemoveAll(bson.M{
		"_id": bson.M{
			"$nin": chartIDs,
		},
		"repo.name": charts[0].Repo.Name,
	})

	_, err := bulk.Run()
	return err
}

func (m *MongoDBChartRepoDatastore) StoreChartIcon(c Chart, b bytes.Buffer) error {
	db, closer := m.dbSession.DB()
	defer closer()
	return db.C(chartCollection).UpdateId(c.ID, bson.M{"$set": bson.M{"raw_icon": b.Bytes()}})
}

func (m *MongoDBChartRepoDatastore) StoreChartFiles(chartFilesID string, chartFiles ChartFiles) error {
	db, closer := m.dbSession.DB()
	defer closer()

	// inserts the chart files if not already indexed, or updates the existing
	// entry if digest has changed
	db.C(chartFilesCollection).UpsertId(chartFilesID, chartFiles)

	return nil
}
