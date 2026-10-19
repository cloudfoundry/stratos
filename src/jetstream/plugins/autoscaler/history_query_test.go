package autoscaler

import (
	"net/url"
	"testing"
)

func TestHistoryQuery(t *testing.T) {
	cases := []struct {
		name string
		in   url.Values
		want string
	}{
		{
			// order-direction is the parameter the autoscaler reads (15.x
			// ignores the deprecated order on scaling histories).
			name: "forwards order-direction unchanged",
			in: url.Values{
				"start-time": {"0"}, "end-time": {"9"}, "page": {"1"},
				"results-per-page": {"5"}, "order-direction": {"asc"},
			},
			want: "?end-time=9&order-direction=asc&page=1&results-per-page=5&start-time=0",
		},
		{
			name: "forwards a sent order as well",
			in:   url.Values{"order": {"asc"}},
			want: "?order=asc",
		},
		{
			// The autoscaler rejects an empty value ("order": invalid value),
			// so a parameter the caller did not send is left out.
			name: "omits parameters that were not sent",
			in:   url.Values{"page": {"2"}, "start-time": {""}},
			want: "?page=2",
		},
		{
			name: "sends nothing for no parameters",
			in:   url.Values{},
			want: "",
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := historyQuery(c.in); got != c.want {
				t.Errorf("historyQuery() = %q, want %q", got, c.want)
			}
		})
	}
}
