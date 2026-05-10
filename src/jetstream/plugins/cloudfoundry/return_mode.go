package cloudfoundry

import (
	"strings"

	"github.com/labstack/echo/v4"
)

// ReturnMode is the four-tier wire-shape selector used by every
// Stratos-shape list and detail handler in the services-domain
// signal+V3 slice (and adopted by future migrations). The handler
// chooses what to compose and what to omit based on the mode.
//
//   - ReturnBase    — entity fields only; relationship refs carry guid only.
//     One CAPI call per page, no joins.
//   - ReturnCounts  — {totalResults: N}; resources empty; per_page=1
//     forwarded upstream. Cheapest mode.
//   - ReturnSummary — base + relationship refs populated to {guid, name}
//     (and chain leaves where applicable). One CAPI call
//     per page, full v3 include= chain.
//   - ReturnDetails — summary + ref nodes expanded with extended fields
//     (description, costs, schemas on plan; description,
//     tags, requires, brokerCatalog on offering; etc.).
//
// Cross-entity aggregation counts (bindingsCount, plansCount, etc.) are
// NOT a wire-shape concern; they're derived in the frontend over
// registry-resident entity signals. See the canonical plan at
// obsidian-knowledge-store/stratos/plans/2026-05-07-services-domain-signal-v3.md.
type ReturnMode string

const (
	ReturnBase    ReturnMode = "base"
	ReturnCounts  ReturnMode = "counts"
	ReturnSummary ReturnMode = "summary"
	ReturnDetails ReturnMode = "details"
)

// parseReturnMode reads ?return= and maps it to a ReturnMode. Unknown
// values fall back to ReturnBase so older consumers don't 400 against
// servers that grow new modes — the contract is "I'll send you the
// safest tier I understand". Comparison is case-insensitive.
func parseReturnMode(ctx echo.Context) ReturnMode {
	switch strings.ToLower(ctx.QueryParam("return")) {
	case "counts":
		return ReturnCounts
	case "summary":
		return ReturnSummary
	case "details":
		return ReturnDetails
	default:
		return ReturnBase
	}
}
