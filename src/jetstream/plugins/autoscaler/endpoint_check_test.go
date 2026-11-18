package autoscaler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCfDomain(t *testing.T) {
	cases := map[string]string{
		"https://api.sys.example.com":             "sys.example.com",
		"https://autoscaler.sys.example.com:443/": "sys.example.com",
		"autoscaler.sys.example.com":              "sys.example.com",
		"https://localhost":                       "",
		"":                                        "",
	}
	for in, want := range cases {
		if got := cfDomain(in); got != want {
			t.Errorf("cfDomain(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestSameDomain(t *testing.T) {
	const lab = "system.ocf.nabramovitz.lab.fivetwenty.io"
	cases := []struct {
		a, b string
		want bool
	}{
		{"https://api." + lab, "https://autoscaler." + lab, true},
		{"https://api." + lab, "https://autoscaler." + lab + ":443/", true},
		{"https://api." + lab, "https://autoscaler.sys.adepttech.ca", false},
		{"https://localhost", "https://localhost", false},
		{"https://API.Sys.Example.com", "https://autoscaler.sys.example.com", true},
	}
	for _, c := range cases {
		if got := sameDomain(c.a, c.b); got != c.want {
			t.Errorf("sameDomain(%q, %q) = %v, want %v", c.a, c.b, got, c.want)
		}
	}
}

func TestCheckAutoscaler(t *testing.T) {
	serve := func(health, info int, infoBody string) *httptest.Server {
		return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.URL.Path {
			case "/health":
				w.WriteHeader(health)
				_, _ = w.Write([]byte(`{"alive":"true"}`))
			case "/v1/info":
				w.WriteHeader(info)
				_, _ = w.Write([]byte(infoBody))
			default:
				w.WriteHeader(http.StatusNotFound)
			}
		}))
	}

	t.Run("15.3.1 reports its build", func(t *testing.T) {
		s := serve(200, 200, `{"name":"Autoscaler","build":"15.3.1"}`)
		defer s.Close()
		build, err := checkAutoscaler(*s.Client(), s.URL+"/")
		if err != nil || build != "15.3.1" {
			t.Fatalf("got (%q, %v), want (\"15.3.1\", nil)", build, err)
		}
	})

	t.Run("older autoscaler without /v1/info", func(t *testing.T) {
		s := serve(200, 404, "")
		defer s.Close()
		build, err := checkAutoscaler(*s.Client(), s.URL)
		if err != nil || build != "" {
			t.Fatalf("got (%q, %v), want (\"\", nil)", build, err)
		}
	})

	t.Run("a CF API URL is not an autoscaler", func(t *testing.T) {
		s := serve(404, 404, "")
		defer s.Close()
		_, err := checkAutoscaler(*s.Client(), s.URL)
		if err == nil || !strings.Contains(err.Error(), "/health returned 404") {
			t.Fatalf("got %v, want an error containing \"/health returned 404\"", err)
		}
	})

	// A web app that answers every path with 200 and its HTML page (the
	// console itself does) is not an autoscaler.
	t.Run("a web app answering every path with 200 is not an autoscaler", func(t *testing.T) {
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			_, _ = w.Write([]byte("<!doctype html><html><body>app</body></html>"))
		}))
		defer s.Close()
		_, err := checkAutoscaler(*s.Client(), s.URL)
		if err == nil || !strings.Contains(err.Error(), "/health did not answer as an autoscaler") {
			t.Fatalf("got %v, want an error containing \"/health did not answer as an autoscaler\"", err)
		}
	})

	t.Run("a /health body without alive passes when /v1/info names it", func(t *testing.T) {
		s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.URL.Path {
			case "/health":
				_, _ = w.Write([]byte(`OK`))
			case "/v1/info":
				_, _ = w.Write([]byte(`{"name":"Autoscaler","build":"16.2.1"}`))
			}
		}))
		defer s.Close()
		build, err := checkAutoscaler(*s.Client(), s.URL)
		if err != nil || build != "16.2.1" {
			t.Fatalf("got (%q, %v), want (\"16.2.1\", nil)", build, err)
		}
	})

	t.Run("unreachable", func(t *testing.T) {
		s := serve(200, 200, "")
		url := s.URL
		s.Close()
		if _, err := checkAutoscaler(http.Client{}, url); err == nil {
			t.Fatal("got nil, want an error")
		}
	})
}
