package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

const (
	defaultPort      = 8090
	defaultAddress   = "0.0.0.0"
	reportsDirEnvVar = "ANALYSIS_REPORTS_DIR"
	scriptsDirEnvVar = "ANALYSIS_SCRIPTS_DIR"
	logLevelEnvVar   = "LOG_LEVEL"
	logToJSONEnvVar  = "LOG_TO_JSON"
)

type Analyzer struct {
	reportsDir string
	jobs       map[string]*AnalysisJob
}

// logLevel backs the installed handler so LOG_LEVEL can be applied after the
// handler is in place. Its zero value is slog.LevelInfo, which is the level
// logrus defaulted to.
var logLevel slog.LevelVar

// setupLogging installs the process-wide slog handler. The analysis container
// is a separate executable from the Jetstream backend, so it cannot inherit
// the handler the backend installs; it mirrors that setup instead, honouring
// the same LOG_LEVEL and LOG_TO_JSON environment variables.
//
// Note there is deliberately no colour forcing here: the handler leaves
// output plain so deployed logs stay parseable by log aggregators.
func setupLogging() {
	opts := &slog.HandlerOptions{Level: &logLevel}
	var handler slog.Handler = slog.NewTextHandler(os.Stdout, opts)
	if os.Getenv(logToJSONEnvVar) == "true" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}
	slog.SetDefault(slog.New(handler))

	if name, ok := os.LookupEnv(logLevelEnvVar); ok && strings.TrimSpace(name) != "" {
		// The key is "logLevel", not "level": slog's own level attribute is
		// called "level", and a duplicate key makes the JSON record ambiguous.
		slog.Info("setting the log level", "logLevel", name)
		level, err := parseLogLevel(name)
		if err != nil {
			// logrus.ParseLevel returned PanicLevel on a bad value, so a typo
			// in LOG_LEVEL used to silence the analyzer completely.
			slog.Warn("keeping the current log level", "error", err)
		} else {
			logLevel.Set(level)
		}
	}
}

// parseLogLevel accepts the level names logrus did, so an existing LOG_LEVEL
// keeps working. slog has no trace/fatal/panic, so they fold into the nearest
// level that exists.
func parseLogLevel(name string) (slog.Level, error) {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "trace", "debug":
		return slog.LevelDebug, nil
	case "info":
		return slog.LevelInfo, nil
	case "warn", "warning":
		return slog.LevelWarn, nil
	case "error", "fatal", "panic":
		return slog.LevelError, nil
	}
	return slog.LevelInfo, fmt.Errorf("unknown log level %q", name)
}

func main() {
	setupLogging()

	slog.Info("========================================")
	slog.Info("=== Stratos Analysis API Server      ===")
	slog.Info("========================================")
	slog.Info("")
	slog.Info("Initialization started.")

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
			slog.Error("cannot get the absolute path for the reports folder",
				"folder", reportsDir, "error", err)
			os.Exit(1)
		}
		a.reportsDir = dir
	} else {
		a.reportsDir = filepath.Join(os.TempDir(), "stratos-analysis")
	}
	slog.Info("using reports folder", "folder", a.reportsDir)

	// Make the directory if it does not exit
	if _, err := os.Stat(a.reportsDir); os.IsNotExist(err) {
		if err := os.MkdirAll(a.reportsDir, os.ModePerm); err != nil {
			slog.Error("could not create the folder for analysis reports",
				"folder", a.reportsDir, "error", err)
			os.Exit(1)
		}
	}

	// Start a simple web server
	e := echo.New()
	// Echo v5 logs through slog and defaults to JSON on stdout; hand it the
	// application logger so format and LOG_LEVEL are consistent.
	e.Logger = slog.Default()
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogRemoteIP:      true,
		LogMethod:        true,
		LogURIPath:       true,
		LogStatus:        true,
		LogLatency:       true,
		LogContentLength: true,
		LogResponseSize:  true,
		LogValuesFunc: func(c *echo.Context, v middleware.RequestLoggerValues) error {
			// "start" rather than "time" for the same reason: slog already
			// emits a "time" attribute for the record itself.
			slog.Info("Request",
				"start", v.StartTime.Format(time.RFC3339), "remoteIP", v.RemoteIP,
				"method", v.Method, "path", v.URIPath, "status", v.Status,
				"latency", v.Latency, "bytesIn", v.ContentLength, "bytesOut", v.ResponseSize)
			return nil
		},
	}))
	e.Use(middleware.Recover())

	a.registerRoutes(e)

	var engineErr error
	address := fmt.Sprintf("%s:%d", defaultAddress, defaultPort)
	slog.Info("starting the HTTP server", "address", address)
	engineErr = echo.StartConfig{
		Address:    address,
		HideBanner: true,
		HidePort:   true,
	}.Start(context.Background(), e)

	if engineErr != nil {
		if !strings.Contains(engineErr.Error(), "Server closed") {
			slog.Warn("failed to start the HTTP/S server", "address", address, "error", engineErr)
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
	return func(c *echo.Context) error {
		c.Response().Header().Set("cache-control", "no-store")
		c.Response().Header().Set("pragma", "no-cache")
		return h(c)
	}
}

// Set the name of the job
func setJobNameAndPath(job *AnalysisJob, title string) {
	job.Name = fmt.Sprintf("%s cluster analysis", title)
	job.Path = ""

	slog.Debug("setting the job name and path", "title", title, "config", job.Config)

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
		slog.Error("could not get the folder of the running program",
			"program", os.Args[0], "fallback", fallbackPath, "error", err)
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

	slog.Error("unable to locate the scripts folder", "searched", dir, "fallback", fallbackPath)
	return fallbackPath
}
