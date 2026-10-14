package stratosjobs

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// A job the upstream ran and failed is not a gateway failure: the answer
// must not read as "the endpoint is down" to the frontend.
func TestWriteFailed(t *testing.T) {
	e := echo.New()
	rec := httptest.NewRecorder()
	c := e.NewContext(httptest.NewRequest(http.MethodPost, "/", nil), rec)

	errs := []StratosError{{Code: "cf.v3.10009", Message: "CF-UnableToPerform", Detail: "Operation failed"}}
	require.NoError(t, WriteFailed(c, errs))

	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
	assert.Equal(t, ReasonOperationFailed, rec.Header().Get(ErrorReasonHeader))
	var body struct {
		State  JobState       `json:"state"`
		Errors []StratosError `json:"errors"`
	}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	assert.Equal(t, JobStateFailed, body.State)
	assert.Equal(t, errs, body.Errors)
}
