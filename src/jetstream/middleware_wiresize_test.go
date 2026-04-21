package main

import (
	"testing"
)

func TestCountJSONBytes_FlatObject(t *testing.T) {
	body := []byte(`{"name":"foo"}`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 {
		t.Errorf("Keys = %d, want 6 (`\"name\"`)", m.Keys)
	}
	if m.Structural != 3 {
		t.Errorf("Structural = %d, want 3 ({ : })", m.Structural)
	}
	if m.Values != 5 {
		t.Errorf("Values = %d, want 5 (`\"foo\"`)", m.Values)
	}
	if m.Resources != 0 {
		t.Errorf("Resources = %d, want 0", m.Resources)
	}
	if m.Keys+m.Values+m.Structural != m.RawTotal {
		t.Errorf("Keys+Values+Structural=%d should equal RawTotal=%d", m.Keys+m.Values+m.Structural, m.RawTotal)
	}
}

func TestCountJSONBytes_NestedObject(t *testing.T) {
	body := []byte(`{"a":{"b":1}}`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 {
		t.Errorf("Keys = %d, want 6 (`\"a\"`+`\"b\"`)", m.Keys)
	}
	if m.Structural != 6 {
		t.Errorf("Structural = %d, want 6 ({ : { : } })", m.Structural)
	}
	if m.Values != 1 {
		t.Errorf("Values = %d, want 1 (the literal `1`)", m.Values)
	}
}

func TestCountJSONBytes_Whitespace(t *testing.T) {
	body := []byte(`{ "name" : "foo" }`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 {
		t.Errorf("Keys = %d, want 6", m.Keys)
	}
	if m.Values != 5 {
		t.Errorf("Values = %d, want 5", m.Values)
	}
	// Structural = { \s \s : \s \s } = 7
	if m.Structural != 7 {
		t.Errorf("Structural = %d, want 7", m.Structural)
	}
}

func TestCountJSONBytes_ResourcesArray(t *testing.T) {
	body := []byte(`{"resources":[{"guid":"a"},{"guid":"b"},{"guid":"c"}],"pagination":{}}`)
	m := countJSONBytes(body)

	if m.Resources != 3 {
		t.Errorf("Resources = %d, want 3", m.Resources)
	}
	// 4 keys at top level + 3 nested: "resources", "pagination" (2 top) + "guid" x3
	// bytes: `"resources"`=11, `"pagination"`=12, `"guid"`x3=18 → 41
	if m.Keys != 11+12+18 {
		t.Errorf("Keys = %d, want 41 (\"resources\"+\"pagination\"+3x\"guid\")", m.Keys)
	}
}

func TestCountJSONBytes_EscapedQuoteInString(t *testing.T) {
	// String value contains an escaped quote — must not terminate the string early
	body := []byte(`{"note":"has \"quote\" inside"}`)
	m := countJSONBytes(body)

	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	if m.Keys != 6 { // `"note"`
		t.Errorf("Keys = %d, want 6", m.Keys)
	}
	// Structural = { : } = 3
	if m.Structural != 3 {
		t.Errorf("Structural = %d, want 3 — got escaped-quote miscounted as structural", m.Structural)
	}
	// Values = everything after the key "note" and the separator colon, before the closing }
	// That's `"has \"quote\" inside"` literally in the body: 22 chars.
	if m.Values != m.RawTotal-m.Keys-m.Structural {
		t.Errorf("Values arithmetic wrong: %d vs expected %d", m.Values, m.RawTotal-m.Keys-m.Structural)
	}
}

func TestCountJSONBytes_MalformedJSON(t *testing.T) {
	body := []byte(`{"not-valid-`)
	m := countJSONBytes(body)

	// RawTotal still accurate even for malformed input
	if m.RawTotal != len(body) {
		t.Errorf("RawTotal = %d, want %d", m.RawTotal, len(body))
	}
	// Keys should be 0 because unmarshal fails; don't crash
	if m.Keys != 0 {
		t.Errorf("Keys = %d, want 0 for malformed JSON", m.Keys)
	}
}

func TestCountJSONBytes_EmptyObject(t *testing.T) {
	body := []byte(`{}`)
	m := countJSONBytes(body)

	if m.RawTotal != 2 {
		t.Errorf("RawTotal = %d, want 2", m.RawTotal)
	}
	if m.Keys != 0 {
		t.Errorf("Keys = %d, want 0", m.Keys)
	}
	if m.Structural != 2 {
		t.Errorf("Structural = %d, want 2", m.Structural)
	}
	if m.Values != 0 {
		t.Errorf("Values = %d, want 0", m.Values)
	}
}

func TestCountJSONBytes_EmptyArray(t *testing.T) {
	body := []byte(`[]`)
	m := countJSONBytes(body)

	if m.RawTotal != 2 {
		t.Errorf("RawTotal = %d, want 2", m.RawTotal)
	}
	if m.Keys != 0 {
		t.Errorf("Keys = %d, want 0 (no keys in an empty array)", m.Keys)
	}
	if m.Structural != 2 {
		t.Errorf("Structural = %d, want 2", m.Structural)
	}
}

func TestCountJSONBytes_StratosShapeExampleBudget(t *testing.T) {
	// Shape resembling what a real paged apps response will emit; checks that
	// resources length is found under the top-level "resources" key.
	body := []byte(`{"resources":[{"guid":"a","name":"x"},{"guid":"b","name":"y"}],` +
		`"pagination":{"totalResults":2,"totalPages":1,"first":{"href":"/p?page=1"},"last":{"href":"/p?page=1"},"next":null,"previous":null}}`)
	m := countJSONBytes(body)

	if m.Resources != 2 {
		t.Errorf("Resources = %d, want 2", m.Resources)
	}
	if m.Keys+m.Values+m.Structural != m.RawTotal {
		t.Errorf("Closure violated: %d + %d + %d != %d", m.Keys, m.Values, m.Structural, m.RawTotal)
	}
}
