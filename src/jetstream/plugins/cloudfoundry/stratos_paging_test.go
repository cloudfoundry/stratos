package cloudfoundry

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func newTestContext(path, rawQuery string) echo.Context {
	e := echo.New()
	req := httptest.NewRequest("GET", path+"?"+rawQuery, nil)
	rec := httptest.NewRecorder()
	return e.NewContext(req, rec)
}

func TestBuildPaginationMeta_MiddlePage(t *testing.T) {
	c := newTestContext("/pp/v1/cf/apps/cnsi-abc", "page=3&per_page=10&order_by=name")
	m := BuildPaginationMeta(c, 3, 10, 52)

	if m.TotalResults != 52 {
		t.Errorf("TotalResults = %d, want 52", m.TotalResults)
	}
	if m.TotalPages != 6 {
		t.Errorf("TotalPages = %d, want 6 (ceil(52/10))", m.TotalPages)
	}
	if m.First == nil || !strings.Contains(m.First.Href, "page=1") {
		t.Errorf("First.Href should contain page=1, got %+v", m.First)
	}
	if m.Last == nil || !strings.Contains(m.Last.Href, "page=6") {
		t.Errorf("Last.Href should contain page=6, got %+v", m.Last)
	}
	if m.Previous == nil || !strings.Contains(m.Previous.Href, "page=2") {
		t.Errorf("Previous.Href should contain page=2, got %+v", m.Previous)
	}
	if m.Next == nil || !strings.Contains(m.Next.Href, "page=4") {
		t.Errorf("Next.Href should contain page=4, got %+v", m.Next)
	}
	if !strings.Contains(m.First.Href, "per_page=10") || !strings.Contains(m.First.Href, "order_by=name") {
		t.Errorf("links should preserve non-page query params, got %s", m.First.Href)
	}
	if !strings.HasPrefix(m.First.Href, "/pp/v1/cf/apps/cnsi-abc?") {
		t.Errorf("link should be relative path from request, got %s", m.First.Href)
	}
}

func TestBuildPaginationMeta_FirstPage(t *testing.T) {
	c := newTestContext("/pp/v1/cf/apps/cnsi-abc", "page=1&per_page=10")
	m := BuildPaginationMeta(c, 1, 10, 52)

	if m.Previous != nil {
		t.Errorf("Previous should be nil on page 1, got %+v", m.Previous)
	}
	if m.Next == nil {
		t.Errorf("Next should be set on page 1 of multi-page result")
	}
	if m.First == nil || m.Last == nil {
		t.Errorf("First and Last should always be set when results exist")
	}
}

func TestBuildPaginationMeta_LastPage(t *testing.T) {
	c := newTestContext("/pp/v1/cf/apps/cnsi-abc", "page=6&per_page=10")
	m := BuildPaginationMeta(c, 6, 10, 52)

	if m.Next != nil {
		t.Errorf("Next should be nil on last page, got %+v", m.Next)
	}
	if m.Previous == nil {
		t.Errorf("Previous should be set on last page")
	}
}

func TestBuildPaginationMeta_EmptyResultSet(t *testing.T) {
	c := newTestContext("/pp/v1/cf/apps/cnsi-abc", "page=1&per_page=10")
	m := BuildPaginationMeta(c, 1, 10, 0)

	if m.TotalResults != 0 {
		t.Errorf("TotalResults = %d, want 0", m.TotalResults)
	}
	if m.TotalPages != 0 {
		t.Errorf("TotalPages = %d, want 0 when empty", m.TotalPages)
	}
	if m.First != nil || m.Last != nil || m.Next != nil || m.Previous != nil {
		t.Errorf("All links should be nil for empty result set")
	}
}

func TestBuildPaginationMeta_TerminalLinksSerialiseAsNull(t *testing.T) {
	c := newTestContext("/pp/v1/cf/apps/cnsi-abc", "page=1&per_page=10")
	m := BuildPaginationMeta(c, 1, 10, 5)

	body, err := json.Marshal(m)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	if !strings.Contains(string(body), `"previous":null`) {
		t.Errorf("previous should serialise as explicit null on page 1, got %s", string(body))
	}
	if !strings.Contains(string(body), `"next":null`) {
		t.Errorf("next should serialise as null on single-page result, got %s", string(body))
	}
}

func TestBuildPaginationMeta_SinglePage(t *testing.T) {
	c := newTestContext("/pp/v1/cf/apps/cnsi-abc", "page=1&per_page=100")
	m := BuildPaginationMeta(c, 1, 100, 5)

	if m.TotalPages != 1 {
		t.Errorf("TotalPages = %d, want 1", m.TotalPages)
	}
	if m.Previous != nil || m.Next != nil {
		t.Errorf("Previous and Next should be nil on single page")
	}
	if m.First == nil || m.Last == nil {
		t.Errorf("First and Last should still be set on single page")
	}
	if m.First.Href != m.Last.Href {
		t.Errorf("First and Last should point to same page when there's only one page")
	}
}

func TestBuildPaginationMeta_ExactMultiple(t *testing.T) {
	c := newTestContext("/pp/v1/cf/apps/cnsi-abc", "page=1&per_page=10")
	m := BuildPaginationMeta(c, 1, 10, 50)

	if m.TotalPages != 5 {
		t.Errorf("TotalPages = %d, want 5 (50/10)", m.TotalPages)
	}
}

func TestStratosPagedResponse_Generic(t *testing.T) {
	type TestResource struct {
		Guid string `json:"guid"`
		Name string `json:"name"`
	}

	resp := StratosPagedResponse[TestResource]{
		Resources: []TestResource{{Guid: "a", Name: "x"}, {Guid: "b", Name: "y"}},
		Pagination: PaginationMeta{
			TotalResults: 2,
			TotalPages:   1,
			First:        &Href{Href: "/p?page=1"},
			Last:         &Href{Href: "/p?page=1"},
		},
	}

	body, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	s := string(body)
	for _, want := range []string{
		`"resources"`, `"pagination"`,
		`"totalResults":2`, `"totalPages":1`,
		`"first":{"href":"/p?page=1"}`,
		`"previous":null`, `"next":null`,
		`"guid":"a"`, `"name":"y"`,
	} {
		if !strings.Contains(s, want) {
			t.Errorf("marshalled body missing %q, got %s", want, s)
		}
	}
	// _meta should be omitted when nil
	if strings.Contains(s, `_meta`) {
		t.Errorf("_meta should be omitted when nil, got %s", s)
	}
}

func TestStratosPagedResponse_WithMeta(t *testing.T) {
	resp := StratosPagedResponse[map[string]string]{
		Resources:  []map[string]string{},
		Pagination: PaginationMeta{},
		Meta: &StratosMeta{
			Unavailable: []string{"memory"},
			Errors: []StratosError{
				{
					Scope:         "envelope",
					Code:          "PROCESSES_FETCH_FAILED",
					Title:         "Processes unavailable",
					Detail:        "CAPI 503",
					Affected:      []string{"memory", "diskQuota", "instances"},
					AffectedGuids: []string{"app-1", "app-2"},
				},
			},
		},
	}

	body, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	s := string(body)

	for _, want := range []string{
		`"_meta"`,
		`"unavailable":["memory"]`,
		`"scope":"envelope"`,
		`"code":"PROCESSES_FETCH_FAILED"`,
		`"affected":["memory","diskQuota","instances"]`,
		`"affectedGuids":["app-1","app-2"]`,
	} {
		if !strings.Contains(s, want) {
			t.Errorf("meta marshalled body missing %q, got %s", want, s)
		}
	}
}
