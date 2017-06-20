package main

import (
	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"encoding/json"
)

type ManifestResponse struct {
	Manifest string
}

func (cfAppPush *CFAppPush) deploy(echoContext echo.Context) error {
	log.Info("Deploying app")

	cnsiGUID := echoContext.Param("cnsiGuid")
	githubUrl := echoContext.FormValue("github_url")

	log.Infof("Received URL: %s for cnsiGuid", githubUrl, cnsiGUID)
	resp := &ManifestResponse{
		Manifest:     "manifest",
	}
	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	echoContext.Response().Header().Set("Content-Type", "application/json")
	echoContext.Response().Write(jsonString)

	return nil

}
