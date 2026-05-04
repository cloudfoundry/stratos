package diagnostics

import (
	"errors"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/labstack/echo/v4"
)

// Diagnostics plugin — dev/operator-facing instrumentation surface. Admin-gated
// endpoint (/pp/v1/admin/diagnostics) returns a JSON envelope of counters and
// samples captured in-memory. Behind the DIAGNOSTICS_ENABLED env flag; off in
// production by default. See FWT-934 design doc for full context.
type Diagnostics struct {
	portalProxy api.PortalProxy
	buffer      *Buffer
	handler     *Handler
}

func init() {
	api.AddPlugin("diagnostics", nil, Init)
}

func Init(portalProxy api.PortalProxy) (api.StratosPlugin, error) {
	enabled := portalProxy.GetConfig().DiagnosticsEnabled
	buffer := NewBuffer(DefaultBufferConfig())
	return &Diagnostics{
		portalProxy: portalProxy,
		buffer:      buffer,
		handler:     NewHandler(buffer, enabled),
	}, nil
}

// Init satisfies api.StratosPlugin. Nothing to do here — the plugin's state
// is set up in the package-level Init constructor.
func (d *Diagnostics) Init() error {
	return nil
}

// Buffer exposes the underlying Buffer so other packages (e.g. the CF HTTP
// client middleware) can emit into the same store the admin endpoint serves.
func (d *Diagnostics) Buffer() *Buffer { return d.buffer }

// Enabled reports whether the DIAGNOSTICS_ENABLED env flag is set. Middleware
// should skip emission when disabled to avoid paying the mutex cost for
// diagnostics nobody will read.
func (d *Diagnostics) Enabled() bool { return d.handler.enabled }

func (d *Diagnostics) GetMiddlewarePlugin() (api.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented")
}

func (d *Diagnostics) GetEndpointPlugin() (api.EndpointPlugin, error) {
	return nil, errors.New("Not implemented")
}

func (d *Diagnostics) GetRoutePlugin() (api.RoutePlugin, error) {
	return d, nil
}

func (d *Diagnostics) AddAdminGroupRoutes(echoGroup *echo.Group) {
	echoGroup.GET("/admin/diagnostics", d.handler.GetDiagnostics)
	echoGroup.POST("/admin/diagnostics/reset", d.handler.ResetDiagnostics)
}

func (d *Diagnostics) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// no-op
}
