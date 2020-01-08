package chartsvc

import (
	"context"
	"fmt"

	"github.com/helm/monocular/chartsvc/foundationdb"
	"github.com/helm/monocular/chartsvc/foundationdb/datastore"
	"github.com/helm/monocular/chartsvc/models"
	log "github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const chartCollection = "charts"

type ChartSvcDatastore struct {
	dbClient datastore.Client
	db       datastore.Database
	dbCloser func()
}

func (m *ChartSvcDatastore) ListRepositories() ([]string, error) {
	return foundationdb.ListRepositories()
}

// GetChart returns the chart with the given ID
func (m *ChartSvcDatastore) GetChart(chartID string) (models.Chart, error) {
	var chart models.Chart

	chartCollection := m.db.Collection(chartCollection)
	filter := bson.M{"_id": chartID}
	findResult := chartCollection.FindOne(context.Background(), filter, &chart, options.FindOne())
	if findResult == mongo.ErrNoDocuments {
		log.WithError(findResult).Errorf("could not find chart with id %s", chartID)
		return chart, fmt.Errorf("could not find chart with id %s", chartID)
	}

	return chart, nil
}
