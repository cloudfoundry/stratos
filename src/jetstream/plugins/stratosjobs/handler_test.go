package stratosjobs

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
)

// getJobAs runs GET /pp/v1/stratos/jobs/:jobId against s as user.
func getJobAs(t *testing.T, s *StratosJobs, id, user string) (*httptest.ResponseRecorder, error) {
	t.Helper()
	s.sessionUser = func(*echo.Context) (string, error) {
		if user == "" {
			return "", errors.New("no session")
		}
		return user, nil
	}
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/pp/v1/stratos/jobs/"+id, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/pp/v1/stratos/jobs/:jobId")
	c.SetPathValues(echo.PathValues{{Name: "jobId", Value: id}})
	return rec, s.getJob(c)
}

func requireStatus(t *testing.T, err error, want int) {
	t.Helper()
	var he *echo.HTTPError
	if !errors.As(err, &he) {
		t.Fatalf("expected an HTTP %d error, got %v", want, err)
	}
	if he.Code != want {
		t.Fatalf("expected HTTP %d, got %d (%s)", want, he.Code, he.Message)
	}
}

// A poll landing on a fresh replica (another pod, a restart, a redeploy)
// gets the job's real state instead of 404.
func TestGetJob_AnotherReplicaReturnsRealState(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	creator := newTestTracker(t, time.Now)
	id := creator.Create("fake.thing.create", tl, backendRef{JobID: "job-1", User: "user-a"})
	tl.set("job-1", JobStateComplete)

	replica := newTestTracker(t, time.Now)
	replica.Register(tl)
	rec, err := getJobAs(t, &StratosJobs{tracker: replica}, id, "user-a")
	if err != nil {
		t.Fatalf("expected 200, got %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var job StratosJob
	if err := json.Unmarshal(rec.Body.Bytes(), &job); err != nil {
		t.Fatal(err)
	}
	if job.ID != id || job.Kind != "fake.thing.create" || job.State != JobStateComplete {
		t.Fatalf("unexpected job: %+v", job)
	}
	if rec.Header().Get("X-Stratos-Schema-Version") != stratosSchemaVersion {
		t.Error("expected the schema version header")
	}
}

func TestGetJob_UnknownIDIs404(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tr.Register(newCodecTranslator())

	_, err := getJobAs(t, &StratosJobs{tracker: tr}, "0123456789abcdef0123456789abcdef", "user-a")
	requireStatus(t, err, http.StatusNotFound)
}

func TestGetJob_BackendJobGoneIs404(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tr.Register(newCodecTranslator()) // backend holds no jobs

	_, err := getJobAs(t, &StratosJobs{tracker: tr}, "fake.thing.create.gone", "user-a")
	requireStatus(t, err, http.StatusNotFound)
}

func TestGetJob_NoSessionUserIs401(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	_, err := getJobAs(t, &StratosJobs{tracker: tr}, "fake.thing.create.job-1", "")
	requireStatus(t, err, http.StatusUnauthorized)
}
