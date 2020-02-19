/*
Copyright (c) 2018 The Helm Authors

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
	"os"

	log "github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

//ServeCmd Start an HTTP server to allow on-demand trigger of sync or delete
var ServeCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start an HTTP server for on-demand trigger of sync or delete",
	Run: func(cmd *cobra.Command, args []string) {
		fdbURL, err := cmd.Flags().GetString("doclayer-url")
		if err != nil {
			log.Fatal(err)
		}
		fDB, err := cmd.Flags().GetString("doclayer-database")
		if err != nil {
			log.Fatal(err)
		}
		cACert, err := cmd.Flags().GetString("cafile")
		if err != nil {
			log.Fatal(err)
		}
		key, err := cmd.Flags().GetString("keyfile")
		if err != nil {
			log.Fatal(err)
		}
		cert, err := cmd.Flags().GetString("certfile")
		if err != nil {
			log.Fatal(err)
		}

		//TLS options must either be all set to enabled TLS, or none set to disable TLS
		var tlsEnabled = cACert != "" && key != "" && cert != ""
		if !(tlsEnabled || (cACert == "" && key == "" && cert == "")) {
			cmd.Help()
			log.Fatal("To enable TLS, all 3 TLS cert paths must be set.")
		}

		debug, err := cmd.Flags().GetBool("debug")
		if err != nil {
			log.Fatal(err)
		}
		authorizationHeader := os.Getenv("AUTHORIZATION_HEADER")

		initOnDemandEndpoint(fdbURL, fDB, tlsEnabled, cACert, cert, key, authorizationHeader, debug)
	},
}
