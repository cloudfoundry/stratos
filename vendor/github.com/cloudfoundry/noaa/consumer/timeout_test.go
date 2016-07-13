package consumer_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"github.com/cloudfoundry/noaa/consumer"
	"github.com/cloudfoundry/noaa/consumer/internal"
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

type nullHandler chan struct{}

func (h nullHandler) ServeHTTP(http.ResponseWriter, *http.Request) {
	<-h
}

const (
	appGuid              = "fakeAppGuid"
	authToken            = "fakeAuthToken"
	testHandshakeTimeout = 1 * time.Second
)

var (
	cnsmr       *consumer.Consumer
	testServer  *httptest.Server
	fakeHandler nullHandler
)

var _ = Describe("Timeout", func() {
	AfterSuite(func() {
		if testServer != nil {
			testServer.Close()
		}
	})

	BeforeEach(func() {
		internal.HandshakeTimeout = testHandshakeTimeout

		fakeHandler = make(nullHandler, 1)
		testServer = httptest.NewServer(fakeHandler)
	})

	AfterEach(func() {
		cnsmr.Close()
	})

	Describe("TailingLogsWithoutReconnect", func() {
		It("times out due to handshake timeout", func() {
			defer close(fakeHandler)
			cnsmr = consumer.New(strings.Replace(testServer.URL, "http", "ws", 1), nil, nil)

			_, errCh := cnsmr.TailingLogsWithoutReconnect(appGuid, authToken)
			var err error
			Eventually(errCh, 2*testHandshakeTimeout).Should(Receive(&err))
			Expect(err.Error()).To(ContainSubstring("i/o timeout"))
		})
	})

	Describe("Stream", func() {
		It("times out due to handshake timeout", func() {
			defer close(fakeHandler)

			cnsmr = consumer.New(strings.Replace(testServer.URL, "http", "ws", 1), nil, nil)

			_, errCh := cnsmr.Stream(appGuid, authToken)
			var err error
			Eventually(errCh, 2*testHandshakeTimeout).Should(Receive(&err))
			Expect(err.Error()).To(ContainSubstring("i/o timeout"))
		})
	})

})
