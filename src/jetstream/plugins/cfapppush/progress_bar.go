package cfapppush

import (
	"io"
)

// Fake progress bar - don't want to show progress in backend logs
// We could add support for sending this to the client and having a nicer UI there
type cfPushProgressBar struct{}

func (t *cfPushProgressBar) Ready() {}

func (t *cfPushProgressBar) Complete() {}

func (t *cfPushProgressBar) NewProgressBarWrapper(reader io.Reader, sizeOfFile int64) io.Reader {
	return reader
}
