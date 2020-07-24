package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	log "github.com/sirupsen/logrus"
)

const (
	defaultPort      = 8090
	defaultAddress   = "0.0.0.0"
	reportsDirEnvVar = "ANALYSIS_REPORTS_DIR"
	scriptsDirEnvVar = "ANALYSIS_SCRIPTS_DIR"
)

type Analyzer struct {
	reportsDir string
	jobs       map[string]*AnalysisJob
}

func main() {
	log.SetFormatter(&log.TextFormatter{ForceColors: true, FullTimestamp: true, TimestampFormat: time.UnixDate})

	log.SetOutput(os.Stdout)

	log.Info("========================================")
	log.Info("=== Stratos Analysis API Server      ===")
	log.Info("========================================")
	log.Info("")
	log.Info("Initialization started.")

	analyzer := Analyzer{}
	analyzer.jobs = make(map[string]*AnalysisJob)

	analyzer.Start()
}

func (a *Analyzer) Start() {

	// Reports folder

	// Init reports directory
	if reportsDir, ok := os.LookupEnv(reportsDirEnvVar); ok {
		dir, err := filepath.Abs(reportsDir)
		if err != nil {
			log.Fatal("Can not get absolute path for reports folder")
		}
		a.reportsDir = dir
	} else {
		a.reportsDir = filepath.Join(os.TempDir(), "stratos-analysis")
	}
	log.Infof("Using reports folder: %s", a.reportsDir)

	// Make the directory if it does not exit
	if _, err := os.Stat(a.reportsDir); os.IsNotExist(err) {
		if os.MkdirAll(a.reportsDir, os.ModePerm) != nil {
			log.Fatal("Could not create folder for analysis reports")
		}
	}

	// Start a simple web server
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	customLoggerConfig := middleware.LoggerConfig{
		Format: `Request: [${time_rfc3339}] Remote-IP:"${remote_ip}" ` +
			`Method:"${method}" Path:"${path}" Status:${status} Latency:${latency_human} ` +
			`Bytes-In:${bytes_in} Bytes-Out:${bytes_out}` + "\n",
	}
	e.Use(middleware.LoggerWithConfig(customLoggerConfig))
	e.Use(middleware.Recover())

	a.registerRoutes(e)

	var engineErr error
	address := fmt.Sprintf("%s:%d", defaultAddress, defaultPort)
	log.Infof("Starting HTTP Server at address: %s", address)
	engineErr = e.Start(address)

	if engineErr != nil {
		engineErrStr := fmt.Sprintf("%s", engineErr)
		if !strings.Contains(engineErrStr, "Server closed") {
			log.Warnf("Failed to start HTTP/S server: %+v", engineErr)
		}
	}
}

func (a *Analyzer) registerRoutes(e *echo.Echo) {
	api := e.Group("/api")
	api.Use(setSecureCacheContentMiddleware)

	// Liveness check
	api.GET("/v1/ping", a.ping)
	// Run the given analyzer
	api.POST("/v1/run/:analyzer", a.run)
	// Get status
	api.POST("/v1/status", a.status)
	// Get a report
	api.GET("/v1/report/:user/:endpoint/:id/:file", a.report)
	// Delete a report
	api.DELETE("/v1/report/:user/:endpoint/:id", a.delete)
	// Delete all reports for an endpoint
	api.DELETE("/v1/report/:endpoint", a.deleteEndpoint)
}

func setSecureCacheContentMiddleware(h echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set("cache-control", "no-store")
		c.Response().Header().Set("pragma", "no-cache")
		return h(c)
	}
}

// Set the name of the job
func setJobNameAndPath(job *AnalysisJob, title string) {
	job.Name = fmt.Sprintf("%s cluster analysis", title)
	job.Path = ""

	log.Info("setJobNameAndPath")
	log.Infof("%+v", job.Config)

	if job.Config != nil {
		if len(job.Config.Namespace) > 0 {
			if len(job.Config.App) > 0 {
				job.Name = fmt.Sprintf("%s workload analysis: %s in %s", title, job.Config.App, job.Config.Namespace)
				job.Path = fmt.Sprintf("%s/%s", job.Config.Namespace, job.Config.App)
			} else {
				job.Name = fmt.Sprintf("%s namespace analysis: %s", title, job.Config.Namespace)
				job.Path = job.Config.Namespace
			}
		}
	}
}

func getScriptFolder() string {
	fallbackPath, err := os.Getwd()
	if err != nil {
		fallbackPath = "."
	}

	// Look first at the env var, then at a relative path to the executable
	if dir, ok := os.LookupEnv(scriptsDirEnvVar); ok {
		return dir
	}

	// Relative to the executable
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		log.Error("Could not get folder of the running program")
		return fallbackPath
	}

	scripts := filepath.Join(dir, "scripts")
	if _, err := os.Stat(scripts); !os.IsNotExist(err) {
		return scripts
	}

	scripts = filepath.Join(dir, "plugins±", "analysis", "container", "scripts")
	if _, err := os.Stat(scripts); !os.IsNotExist(err) {
		return scripts
	}

	log.Error("Unable to locate scripts folder")
	return fallbackPath
}
