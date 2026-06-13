// src/jetstream/plugins/cloudfoundry/native_bulk.go
package cloudfoundry

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"

	"github.com/fivetwenty-io/capi/v3/pkg/capi"
	"github.com/labstack/echo/v4"
)

// Bulk item states. CF v3 has no batch endpoints, so a Stratos bulk request
// fans out to N CF calls; each item resolves independently to one of these.
const (
	bulkStateComplete = "COMPLETE"
	bulkStateFailed   = "FAILED"
	bulkStatePending  = "PENDING"
)

// bulkMaxItems bounds a single bulk request. The UI multi-select tops out at
// one list page, so 100 is generous; the cap exists to keep one HTTP request
// from fanning out into an unbounded CF call storm.
const bulkMaxItems = 100

// bulkMaxConcurrency caps in-flight CF calls per bulk request, matching the
// fan-out width used elsewhere in this plugin (see listRolesForUsers).
const bulkMaxConcurrency = 6

// BulkItemResult is the per-GUID outcome inside a BulkResult envelope.
// Exactly one of Job / Errors is populated, matching State:
//   - COMPLETE: neither (the operation finished synchronously or the async
//     job resolved within the fast-path window)
//   - PENDING:  Job carries the stratosjobs handoff job for frontend polling
//     (omitted when the async-job contract is unwired — see handler godoc)
//   - FAILED:   Errors carries the CF error(s) for this item
type BulkItemResult struct {
	GUID   string          `json:"guid"`
	State  string          `json:"state"`
	Job    interface{}     `json:"job,omitempty"`
	Errors []BulkItemError `json:"errors,omitempty"`
}

// BulkItemError is the per-item error shape: CF error title as Code,
// CF error detail as Message.
type BulkItemError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// BulkResult is the 200 envelope for all bulk endpoints. Results preserve
// the input GUID order regardless of completion order; the counters are
// tallies of the per-item states.
type BulkResult struct {
	Results   []BulkItemResult `json:"results"`
	Succeeded int              `json:"succeeded"`
	Failed    int              `json:"failed"`
	Pending   int              `json:"pending"`
}

// bulkGUIDsBody is the accepted JSON payload for bulk endpoints.
type bulkGUIDsBody struct {
	GUIDs []string `json:"guids"`
}

// decodeBulkGUIDs decodes and validates the {"guids": [...]} body shared by
// the bulk endpoints. Empty and oversized (> bulkMaxItems) lists are caller
// errors — there is nothing sensible to fan out.
func decodeBulkGUIDs(c echo.Context) ([]string, error) {
	var body bulkGUIDsBody
	if err := json.NewDecoder(c.Request().Body).Decode(&body); err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("invalid body: %v", err))
	}
	if len(body.GUIDs) == 0 {
		return nil, echo.NewHTTPError(http.StatusBadRequest, "guids must be a non-empty array")
	}
	if len(body.GUIDs) > bulkMaxItems {
		return nil, echo.NewHTTPError(http.StatusBadRequest,
			fmt.Sprintf("too many guids: %d (max %d per request)", len(body.GUIDs), bulkMaxItems))
	}
	return body.GUIDs, nil
}

// bulkFanout runs op for every guid with bounded concurrency and assembles a
// BulkResult. Items are independent: one failure never cancels the others
// (deliberately not errgroup-with-cancel — a partially-applied bulk action
// must report per-item outcomes, not abort midway). Results come back in
// input order even though ops complete out of order.
func bulkFanout(ctx context.Context, guids []string, maxConcurrency int, op func(context.Context, string) BulkItemResult) BulkResult {
	results := make([]BulkItemResult, len(guids))

	sem := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup
	for i, guid := range guids {
		sem <- struct{}{}
		wg.Add(1)
		go func(idx int, g string) {
			defer func() { <-sem; wg.Done() }()
			results[idx] = op(ctx, g)
		}(i, guid)
	}
	wg.Wait()

	res := BulkResult{Results: results}
	for _, r := range results {
		switch r.State {
		case bulkStateComplete:
			res.Succeeded++
		case bulkStateFailed:
			res.Failed++
		default:
			res.Pending++
		}
	}
	return res
}

// bulkItemErrorsFromCapi maps a capi error to the per-item error shape,
// preserving the CF error envelope's title/detail when present (the per-item
// analogue of handleCapiError, which writes a whole-response body instead).
func bulkItemErrorsFromCapi(err error) []BulkItemError {
	var respErr *capi.ResponseError
	if errors.As(err, &respErr) && len(respErr.Errors) > 0 {
		out := make([]BulkItemError, 0, len(respErr.Errors))
		for _, e := range respErr.Errors {
			out = append(out, BulkItemError{Code: e.Title, Message: e.Detail})
		}
		return out
	}
	return []BulkItemError{{Code: "CF_ERROR", Message: err.Error()}}
}
