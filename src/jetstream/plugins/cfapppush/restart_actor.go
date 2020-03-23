package cfapppush

import (
	"code.cloudfoundry.org/cli/actor/v2action"
	v6 "code.cloudfoundry.org/cli/command/v6"
	"github.com/gorilla/websocket"
)

type cfPushRestartActor struct {
	wrapped         v6.RestartActor
	sent            bool
	msgSender       DeployAppMessageSender
	clientWebsocket *websocket.Conn
}

func (r *cfPushRestartActor) GetApplicationByNameAndSpace(name string, spaceGUID string) (v2action.Application, v2action.Warnings, error) {
	return r.wrapped.GetApplicationByNameAndSpace(name, spaceGUID)
}

func (r *cfPushRestartActor) GetApplicationSummaryByNameAndSpace(name string, spaceGUID string) (v2action.ApplicationSummary, v2action.Warnings, error) {
	return r.wrapped.GetApplicationSummaryByNameAndSpace(name, spaceGUID)
}

// RestartApplication is our intercept to communicate the App GUID back to the front-end
func (r *cfPushRestartActor) RestartApplication(app v2action.Application, client v2action.NOAAClient) (<-chan *v2action.LogMessage, <-chan error, <-chan v2action.ApplicationStateChange, <-chan string, <-chan error) {

	// Only send for the first app - if there are multiple apps, we will go to the summary for the first one
	if !r.sent {
		r.msgSender.SendEvent(r.clientWebsocket, APP_GUID_NOTIFY, app.GUID)
	}

	r.sent = true
	return r.wrapped.RestartApplication(app, client)
}
