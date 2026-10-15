package stratosjobs

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/testutil"
)

// backendRef is what codecTranslator stores: the backend's job id and the
// user the backend is polled as.
type backendRef struct {
	JobID string
	User  string
}

// codecTranslator stands in for a translator whose ref can be rebuilt from
// the job id ("<kind>.<backend job id>"). Its backend is a map shared by
// every tracker in a test, the way one CF is shared by every replica.
type codecTranslator struct {
	mu      sync.Mutex
	backend map[string]JobState // backend job id -> state; absent = no such job
	users   map[string]bool     // users that hold a token for the backend
	fetches int
	seen    []string // user each Fetch polled as
}

func newCodecTranslator() *codecTranslator {
	return &codecTranslator{backend: map[string]JobState{}, users: map[string]bool{"user-a": true, "user-b": true}}
}

func (c *codecTranslator) Kind() string { return "fake" }

func (c *codecTranslator) set(jobID string, state JobState) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.backend[jobID] = state
}

func (c *codecTranslator) Fetch(_ context.Context, ref interface{}) (JobState, []StratosError, interface{}, error) {
	r := ref.(backendRef)
	c.mu.Lock()
	defer c.mu.Unlock()
	c.fetches++
	c.seen = append(c.seen, r.User)
	state, ok := c.backend[r.JobID]
	if !ok {
		return "", nil, nil, fmt.Errorf("fake backend: job %s: %w", r.JobID, ErrJobNotFound)
	}
	var result interface{}
	if state == JobStateComplete {
		result = map[string]string{"jobId": r.JobID}
	}
	return state, nil, result, nil
}

func (c *codecTranslator) EncodeID(kind string, ref interface{}) (string, bool) {
	r, ok := ref.(backendRef)
	if !ok || !strings.HasPrefix(kind, "fake.") {
		return "", false
	}
	return kind + "." + r.JobID, true
}

func (c *codecTranslator) DecodeID(id, userGUID string) (string, interface{}, bool) {
	i := strings.LastIndex(id, ".")
	if i < 0 || !strings.HasPrefix(id, "fake.") {
		return "", nil, false
	}
	c.mu.Lock()
	hasToken := c.users[userGUID]
	c.mu.Unlock()
	if !hasToken {
		return "", nil, false
	}
	return id[:i], backendRef{JobID: id[i+1:], User: userGUID}, true
}

func (c *codecTranslator) RefOwner(ref interface{}) string {
	r, _ := ref.(backendRef)
	return r.User
}

func newMetricsTracker(t *testing.T) (*InMemoryTracker, *Metrics) {
	t.Helper()
	m, err := RegisterMetrics(prometheus.NewRegistry())
	if err != nil {
		t.Fatal(err)
	}
	tr := NewInMemoryTracker(InMemoryTrackerConfig{TTL: time.Hour, SweepInterval: time.Hour, Metrics: m})
	t.Cleanup(tr.Stop)
	return tr, m
}

func TestCreate_CodecTranslatorMintsEncodedID(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := newCodecTranslator()

	id := tr.Create("fake.thing.create", tl, backendRef{JobID: "job-1", User: "user-a"})

	if id != "fake.thing.create.job-1" {
		t.Fatalf("expected the encoded id, got %q", id)
	}
	if job, ok := tr.Get(id); !ok || job.ID != id {
		t.Fatalf("expected the job under its encoded id, got %+v, %v", job, ok)
	}
}

func TestCreate_TranslatorWithoutCodecKeepsRandomID(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateProcessing, nil, nil, nil
	}}

	id := tr.Create("cf.app.restage", tl, "ref")

	if len(id) != 32 || strings.Contains(id, ".") {
		t.Fatalf("expected a random 32-char hex id, got %q", id)
	}
}

// A replica that did not create the job (another pod, or this one after a
// restart) rebuilds it from the id and drives the translator as the
// polling user.
func TestResolve_RebuildsJobFromEncodedID(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	creator := newTestTracker(t, time.Now)
	id := creator.Create("fake.thing.create", tl, backendRef{JobID: "job-1", User: "user-a"})

	replica := newTestTracker(t, time.Now)
	replica.Register(tl)

	job, ok := replica.Resolve(context.Background(), id, "user-a")
	if !ok {
		t.Fatal("expected the replica to rebuild the job from its id")
	}
	if job.ID != id || job.Kind != "fake.thing.create" || job.State != JobStateProcessing {
		t.Fatalf("unexpected rebuilt job: %+v", job)
	}

	tl.set("job-1", JobStateComplete)
	job, ok = replica.Resolve(context.Background(), id, "user-a")
	if !ok || job.State != JobStateComplete {
		t.Fatalf("expected the next poll to reach COMPLETE, got %+v, %v", job, ok)
	}
	if job.Result == nil {
		t.Error("expected the backend result on COMPLETE")
	}
	for _, u := range tl.seen {
		if u != "user-a" {
			t.Errorf("expected every fetch to poll as the session user, saw %q", u)
		}
	}
}

func TestResolve_KnownJobRefreshes(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateComplete)
	tr := newTestTracker(t, time.Now)
	tr.Register(tl)
	id := tr.Create("fake.thing.create", tl, backendRef{JobID: "job-1", User: "user-a"})

	job, ok := tr.Resolve(context.Background(), id, "user-a")
	if !ok || job.State != JobStateComplete {
		t.Fatalf("expected COMPLETE, got %+v, %v", job, ok)
	}
}

func TestResolve_UndecodableIDIsNotFound(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	tr := newTestTracker(t, time.Now)
	tr.Register(tl)

	for _, id := range []string{
		"0123456789abcdef0123456789abcdef", // random id this replica never saw
		"other.thing.create.job-1",         // no codec registered for the prefix
		"fake",                             // no separator
		"",
	} {
		if job, ok := tr.Resolve(context.Background(), id, "user-a"); ok {
			t.Errorf("id %q: expected not found, got %+v", id, job)
		}
		if _, ok := tr.Get(id); ok {
			t.Errorf("id %q: expected no tracked job", id)
		}
	}
}

func TestResolve_UserWithoutTokenIsNotFound(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	tr := newTestTracker(t, time.Now)
	tr.Register(tl)

	if job, ok := tr.Resolve(context.Background(), "fake.thing.create.job-1", "user-without-token"); ok {
		t.Fatalf("expected not found, got %+v", job)
	}
	if job, ok := tr.Resolve(context.Background(), "fake.thing.create.job-1", ""); ok {
		t.Fatalf("expected not found without a user, got %+v", job)
	}
	if tl.fetches != 0 {
		t.Errorf("expected no backend call for an id the user cannot decode, got %d", tl.fetches)
	}
}

// The backend saying the job does not exist is a genuine terminal unknown:
// answer not found and keep nothing.
func TestResolve_BackendJobNotFoundIsNotFound(t *testing.T) {
	tl := newCodecTranslator() // backend holds no jobs
	tr, m := newMetricsTracker(t)
	tr.Register(tl)

	if job, ok := tr.Resolve(context.Background(), "fake.thing.create.gone", "user-a"); ok {
		t.Fatalf("expected not found, got %+v", job)
	}
	if _, ok := tr.Get("fake.thing.create.gone"); ok {
		t.Error("expected the rebuilt job to be dropped")
	}
	if got := testutil.ToFloat64(m.ActiveJobs); got != 0 {
		t.Errorf("expected ActiveJobs back at 0, got %v", got)
	}
}

func TestRefresh_BackendJobNotFoundDropsTrackedJob(t *testing.T) {
	tl := newCodecTranslator() // backend holds no jobs
	tr, m := newMetricsTracker(t)
	id := tr.Create("fake.thing.create", tl, backendRef{JobID: "gone", User: "user-a"})

	if job, ok := tr.Refresh(context.Background(), id); ok {
		t.Fatalf("expected not found, got %+v", job)
	}
	if _, ok := tr.Get(id); ok {
		t.Error("expected the job to be dropped")
	}
	if got := testutil.ToFloat64(m.ActiveJobs); got != 0 {
		t.Errorf("expected ActiveJobs back at 0, got %v", got)
	}
}

func TestResolve_ConcurrentPollsRebuildOneJob(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	tr, m := newMetricsTracker(t)
	tr.Register(tl)

	const polls = 32
	var wg sync.WaitGroup
	start := make(chan struct{})
	for i := 0; i < polls; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			if _, ok := tr.Resolve(context.Background(), "fake.thing.create.job-1", "user-a"); !ok {
				t.Error("expected every poll to resolve the job")
			}
		}()
	}
	close(start)
	wg.Wait()

	tr.mu.RLock()
	n := len(tr.jobs)
	tr.mu.RUnlock()
	if n != 1 {
		t.Errorf("expected one tracked job, got %d", n)
	}
	if got := testutil.ToFloat64(m.ActiveJobs); got != 1 {
		t.Errorf("expected ActiveJobs 1, got %v", got)
	}
}

func TestRegister_IgnoresTranslatorWithoutCodec(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tr.Register(&stubTranslator{kind: "stub", fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateComplete, nil, nil, nil
	}})

	if job, ok := tr.Resolve(context.Background(), "stub.thing.job-1", "user-a"); ok {
		t.Fatalf("expected not found, got %+v", job)
	}
}

// A job is served only to the user it polls as. Before this, any session
// that knew an id got the job, polled with its creator's token.
func TestResolve_OtherUserIsNotFound(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	tr := newTestTracker(t, time.Now)
	tr.Register(tl)
	id := tr.Create("fake.thing.create", tl, backendRef{JobID: "job-1", User: "user-a"})

	if job, ok := tr.Resolve(context.Background(), id, "user-b"); ok {
		t.Fatalf("expected user-b to get not found, got %+v", job)
	}
	if tl.fetches != 0 {
		t.Errorf("expected no backend call for another user's job, got %d", tl.fetches)
	}
	if _, ok := tr.Resolve(context.Background(), id, "user-a"); !ok {
		t.Error("expected the owner to resolve the job")
	}
}

func TestResolve_OtherUserIsNotFoundForRebuiltJob(t *testing.T) {
	tl := newCodecTranslator()
	tl.set("job-1", JobStateProcessing)
	replica := newTestTracker(t, time.Now)
	replica.Register(tl)

	if _, ok := replica.Resolve(context.Background(), "fake.thing.create.job-1", "user-a"); !ok {
		t.Fatal("expected user-a to rebuild the job")
	}
	if job, ok := replica.Resolve(context.Background(), "fake.thing.create.job-1", "user-b"); ok {
		t.Fatalf("expected user-b to get not found, got %+v", job)
	}
}

// A translator that cannot name the user its ref polls as gets no owner,
// and a job without an owner is served to nobody.
func TestResolve_JobWithoutOwnerIsNotFound(t *testing.T) {
	tr := newTestTracker(t, time.Now)
	tl := &stubTranslator{fn: func(int) (JobState, []StratosError, interface{}, error) {
		return JobStateComplete, nil, nil, nil
	}}
	id := tr.Create("cf.app.delete", tl, "ref")

	if job, ok := tr.Resolve(context.Background(), id, "user-a"); ok {
		t.Fatalf("expected not found, got %+v", job)
	}
}
