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
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/heptiolabs/healthcheck"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/negroni"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/helm/monocular/chartrepo/common"
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
	apiv1.Methods("GET").Path("/status/{repo}").Handler(WithParams(RepoSyncStatus))

	n := negroni.Classic()
	n.UseHandler(r)
	return n
}

func OnDemandSync(w http.ResponseWriter, req *http.Request, params Params) {

	//Running in serve mode, we dont want to close the db client connection after a request
	var clientKeepAlive = true

	type syncParams struct {
		RepoURL string `json:"repoURL"`
	}

	repoName := params["repo"]
	if repoName == "" {
		err := fmt.Errorf("No Repository name provided in request for Sync action.")
		log.Error(err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var status string
	//If this repo is already syncing, don't start another sync, but return in progress response
	//Ignore error return value when fetching status - we don't care if the repo does not exist yet
	currentRepoStatus, _ := fdb.GetRepoSyncStatus(repoName)
	activeSyncJob := currentRepoStatus.Status == common.SyncStatusInProgress || currentRepoStatus.Status == common.SyncStatusInProgress
	if activeSyncJob {
		status = common.SyncStatusInProgress
	} else {

		dec := json.NewDecoder(req.Body)
		var url syncParams
		if err := dec.Decode(&url); err != nil {
			log.Error(err.Error())
			w.Header().Set("Server", "ChartRepo (On-Demand)")
			http.Error(w, "Error decoding sync request repository URL: "+err.Error(), http.StatusBadRequest)
			return
		}

		repoURL := url.RepoURL

		if repoURL == "" {
			err := fmt.Errorf("No Repository URL provided in request for Sync action.")
			log.Error(err.Error())
			w.Header().Set("Server", "ChartRepo (On-Demand)")
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		go fdb.SyncRepo(fdbClient, fDBName, repoName, repoURL, authorizationHeader, clientKeepAlive)

		status = common.SyncStatusInProgress
	}

	requestUUID, err := uuid.NewUUID()

	//Return sync status in response
	response := common.SyncJobStatusResponse{requestUUID.String(), status}
	js, err := json.Marshal(response)
	if err != nil {
		log.Error(err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Server", "ChartRepo (On-Demand)")
	w.Write(js)
}

func OnDemandDelete(w http.ResponseWriter, req *http.Request, params Params) {
	repoName := params["repo"]
	requestUUID, err := uuid.NewUUID()
	if repoName == "" {
		err := fmt.Errorf("No Repository name provided in request for Delete action.")
		log.Error(err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusBadRequest)
	}

	var status string
	currentRepoStatus, err := fdb.GetRepoSyncStatus(repoName)
	if err != nil {
		log.Errorf("Request: requestUUID, %v", err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	//If this repo is already being deleted, don't start another delete, but return in progress response
	activeDeleteJob := currentRepoStatus.Status == common.DeleteStatusInProgress || currentRepoStatus.Status == common.DeleteStatusInProgress
	if activeDeleteJob {
		status = common.DeleteStatusInProgress
	} else {

		//Running in serve mode, we dont want to close the db client connection after a request
		var clientKeepAlive = true

		go fdb.DeleteRepo(fdbClient, fDBName, repoName, clientKeepAlive)
		status = common.DeleteStatusInProgress
	}

	//Return delete status in response

	response := common.DeleteJobStatusResponse{requestUUID.String(), status}
	js, err := json.Marshal(response)
	if err != nil {
		log.Error(err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Server", "ChartRepo (On-Demand)")
	w.Write(js)
}

func RepoSyncStatus(w http.ResponseWriter, req *http.Request, params Params) {
	repoName := params["repo"]
	if repoName == "" {
		log.Fatal("No Repository name provided in request for sync status.")
	}

	requestUUID, err := uuid.NewUUID()
	status, err := fdb.GetRepoSyncStatus(repoName)
	if err != nil {
		log.Errorf("Request: requestUUID, %v, %v", requestUUID, err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	response := common.SyncJobStatusResponse{
		UUID:   requestUUID.String(),
		Status: status.Status,
	}
	js, err := json.Marshal(response)
	if err != nil {
		log.Errorf("Request: requestUUID, %v, %v", requestUUID, err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Server", "ChartRepo (On-Demand)")
	w.Write(js)
}

func RepoDeleteStatus(w http.ResponseWriter, req *http.Request, params Params) {
	repoName := params["repo"]
	if repoName == "" {
		log.Fatal("No Repository name provided in request for delete status.")
	}

	requestUUID, err := uuid.NewUUID()
	status, err := fdb.GetRepoDeleteStatus(repoName)
	if err != nil {
		log.Errorf("Request: requestUUID, %v", err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	response := common.DeleteJobStatusResponse{requestUUID.String(), status.Status}
	js, err := json.Marshal(response)
	if err != nil {
		log.Errorf("Request: requestUUID, %v", err.Error())
		w.Header().Set("Server", "ChartRepo (On-Demand)")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Server", "ChartRepo (On-Demand)")
	w.Write(js)
}

func initOnDemandEndpoint(fdbURL string, fdbName string, tlsEnabled bool, caCertFile string, certFile string, keyFile string, authHeader string, debug bool) {

	authorizationHeader = authHeader
	fDBName = fdbName

	if debug {
		log.SetLevel(log.DebugLevel)
	}

	InitFDBDocLayerConnection(&fdbURL, &fdbName, &tlsEnabled, &caCertFile, &certFile, &keyFile, &debug)

	n := setupRoutes()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port
	log.Infof("On-Demand endpoint listening on: %v", addr)
	if tlsEnabled {
		log.Infof("TLS is enabled.")
	} else {
		log.Infof("TLS is disabled.")
	}
	http.ListenAndServe(addr, n)
}

func InitFDBDocLayerConnection(fdbURL *string, fDB *string, tlsEnabled *bool, CAFile *string, certFile *string, keyFile *string, debug *bool) {

	log.Debugf("Attempting to connect to FDB: %v, %v, debug: %v", *fdbURL, *fDB, *debug)

	var tlsConfig *tls.Config

	if *tlsEnabled {
		//Load CA Cert from file here
		CA, err := ioutil.ReadFile(*CAFile) // just pass the file name
		if err != nil {
			log.Fatalf("Cannot load CA certificate from file: %v.", err)
			return
		}
		CACert := x509.NewCertPool()
		ok := CACert.AppendCertsFromPEM([]byte(CA))
		if !ok {
			log.Fatalf("Cannot append CA certificate to certificate pool.")
			return
		}
		//Now load the key pair and create tls options struct
		clientKeyPair, err := tls.LoadX509KeyPair(*certFile, *keyFile)
		if err != nil {
			log.Fatalf("Cannot load server keypair: %v", err)
			return
		}

		tlsConfig = &tls.Config{RootCAs: CACert, Certificates: []tls.Certificate{clientKeyPair}}
	}

	//Init client options and open connection
	clientOptions := options.Client().ApplyURI(*fdbURL).SetMinPoolSize(10).SetMaxPoolSize(100)
	if *tlsEnabled {
		clientOptions.SetTLSConfig(tlsConfig)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	client, err := fdb.NewDocLayerClient(ctx, clientOptions)
	fdbClient = client
	if err != nil {
		log.Fatalf("Can't create client for FoundationDB document layer: %v. URL provided was: %v", err, *fdbURL)
		return
	}
	log.Debugf("FDB Document Layer client created.")
}
