package cloudfoundry

import (
	"net/url"
	"strconv"

	"github.com/labstack/echo/v4"
)

// Href is the object-wrapped link shape used for pagination navigation.
// Wrapper leaves room to extend (e.g., method, type) without breaking shape.
type Href struct {
	Href string `json:"href"`
}

// PaginationMeta is the Stratos-shape pagination envelope. Mirrors CAPI V3's
// shape with camelCase keys per the Stratos-shape contract. Terminal links
// emit null on the wire rather than omitting the key — unambiguous and
// matches CAPI convention so consumers can rely on presence of the key.
type PaginationMeta struct {
	TotalResults int   `json:"totalResults"`
	TotalPages   int   `json:"totalPages"`
	First        *Href `json:"first"`
	Last         *Href `json:"last"`
	Next         *Href `json:"next"`
	Previous     *Href `json:"previous"`
}

// StratosPagedResponse is the envelope returned by every Stratos-shape list
// endpoint. Resources is the page of items (type per-handler via generics).
// Pagination is the paging meta. Meta carries optional tristate / error data
// — absent / nil when the response has no diagnostic data to surface.
type StratosPagedResponse[T any] struct {
	Resources  []T            `json:"resources"`
	Pagination PaginationMeta `json:"pagination"`
	Meta       *StratosMeta   `json:"_meta,omitempty"`
}

// StratosMeta carries envelope-level tristate uncertainty ("unavailable"
// fields the handler couldn't populate) and composition errors. Absent when
// the response has no diagnostic data.
type StratosMeta struct {
	Unavailable []string       `json:"unavailable,omitempty"`
	Errors      []StratosError `json:"errors,omitempty"`
}

// StratosError describes one error encountered during composition. Multiple
// errors may appear in a single response (one per distinct root cause).
// Scope discriminates between envelope-wide errors that affect multiple rows
// and errors scoped to a specific row.
type StratosError struct {
	Scope         string   `json:"scope,omitempty"`
	Code          string   `json:"code"`
	Title         string   `json:"title"`
	Detail        string   `json:"detail,omitempty"`
	Guid          string   `json:"guid,omitempty"`
	Affected      []string `json:"affected,omitempty"`
	AffectedGuids []string `json:"affectedGuids,omitempty"`
}

// BuildPaginationMeta constructs the pagination envelope for a Stratos-shape
// paged response. Links are relative paths built from the incoming request's
// URL (no hardcoded route templates; proxy deployments that strip prefixes
// continue to work). totalResults is supplied by the handler after the
// backing fetch; totalPages is derived.
//
// Terminal links are nil (serialised as JSON null) when they don't apply —
// no previous on page 1, no next on the last page, and first/last both nil
// when the result set is empty.
func BuildPaginationMeta(c echo.Context, currentPage, perPage, totalResults int) PaginationMeta {
	pm := PaginationMeta{
		TotalResults: totalResults,
	}

	if totalResults <= 0 || perPage <= 0 {
		return pm
	}

	pm.TotalPages = (totalResults + perPage - 1) / perPage

	basePath := c.Request().URL.Path
	baseQuery := c.Request().URL.Query()

	buildHref := func(page int) *Href {
		q := cloneQuery(baseQuery)
		q.Set("page", strconv.Itoa(page))
		return &Href{Href: basePath + "?" + q.Encode()}
	}

	pm.First = buildHref(1)
	pm.Last = buildHref(pm.TotalPages)
	if currentPage > 1 {
		pm.Previous = buildHref(currentPage - 1)
	}
	if currentPage < pm.TotalPages {
		pm.Next = buildHref(currentPage + 1)
	}

	return pm
}

func cloneQuery(q url.Values) url.Values {
	clone := make(url.Values, len(q))
	for k, vs := range q {
		cpy := make([]string, len(vs))
		copy(cpy, vs)
		clone[k] = cpy
	}
	return clone
}
