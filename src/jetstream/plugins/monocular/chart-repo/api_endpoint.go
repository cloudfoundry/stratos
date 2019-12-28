/*
Copyright (c) 2017 The Helm Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/heptiolabs/healthcheck"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/negroni"
	"go.mongodb.org/mongo-driver/mongo/options"

	fdb "github.com/helm/monocular/chartrepo/foundationdb"
)

const pathPrefix = "/v1"

var fdbClient fdb.Client
var fDBName string
var authorizationHeader string

// Params a key-value map of path params
type Params map[string]string

// WithParams can be used to wrap handlers to take an extra arg for path params
type WithParams func(http.ResponseWriter, *http.Request, Params)

func (h WithParams) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	h(w, req, vars)
}

func setupRoutes() http.Handler {
	r := mux.NewRouter()

	// Healthcheck
	health := healthcheck.NewHandler()
	r.Handle("/live", health)
	r.Handle("/ready", health)

	// Routes
	apiv1 := r.PathPrefix(pathPrefix).Subrouter()
	apiv1.Methods("PUT").Path("/sync/{repo}").Handler(WithParams(OnDemandSync))
	apiv1.Methods("PUT").Path("/delete/{repo}").Handler(WithParams(OnDemandDelete))

	n := negroni.Classic()
	n.UseHandler(r)
	return n
}

func OnDemandSync(w http.ResponseWriter, req *http.Request, params Params) {
	type syncParams struct {
		RepoURL string `json:"repoURL"`
	}

	dec := json.NewDecoder(req.Body)
	var url syncParams
	if err := dec.Decode(&url); err != nil {
		log.Fatal(err)
	}

	repoURL := url.RepoURL
	repoName := params["repo"]

	if repoURL == "" {
		log.Fatal("No Repository URL provided in request for Sync action.")
	}

	if repoName == "" {
		log.Fatal("No Repository name provided in request for Sync action.")
	}

	startTime := time.Now()
	if err := fdb.SyncRepo(fdbClient, fDBName, repoName, repoURL, authorizationHeader); err != nil {
		log.Fatalf("Can't sync chart repository with database: %v", err)
		return
	}
	timeTaken := time.Since(startTime).Seconds()
	log.Infof("Successfully added the chart repository %s to database in %v seconds", repoName, timeTaken)
}

func OnDemandDelete(w http.ResponseWriter, req *http.Request, params Params) {
	repoName := params["repo"]

	if repoName == "" {
		log.Fatal("No Repository name provided in request for Delete action.")
	}

	if err := fdb.DeleteRepo(fdbClient, fDBName, repoName); err != nil {
		log.Fatalf("Can't delete chart repository %s from database: %v", repoName, err)
	}
}

func initOnDemandEndpoint(fdbURL string, fdbName string, authHeader string, debug bool) {

	authorizationHeader = authHeader
	fDBName = fdbName

	if debug {
		log.SetLevel(log.DebugLevel)
	}

	InitFDBDocLayerConnection(&fdbURL, &fdbName, &debug)

	n := setupRoutes()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port
	log.Infof("On-Demand endpoint listening on: %v", addr)
	http.ListenAndServe(addr, n)
}

func InitFDBDocLayerConnection(fdbURL *string, fDB *string, debug *bool) {

	log.Debugf("Attempting to connect to FDB: %v, %v, debug: %v", *fdbURL, *fDB, *debug)

	clientOptions := options.Client().ApplyURI(*fdbURL).SetMinPoolSize(10).SetMaxPoolSize(100)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	client, err := fdb.NewDocLayerClient(ctx, clientOptions)
	fdbClient = client
	if err != nil {
		log.Fatalf("Can't create client for FoundationDB document layer: %v", err)
		return
	}
	log.Debugf("FDB Document Layer client created.")

}
