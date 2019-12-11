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

package chartrepo

import (
	"github.com/helm/monocular/chartrepo/foundationdb"

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
		debug, err := cmd.Flags().GetBool("debug")
		if err != nil {
			log.Fatal(err)
		}
		authorizationHeader := os.Getenv("AUTHORIZATION_HEADER")

		initOnDemandEndpoint(fdbURL, fDB, debug, authorizationHeader)
	},
}
