package consumer_test

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/http/httptest"

	"github.com/cloudfoundry/loggregatorlib/loggertesthelper"
	"github.com/cloudfoundry/loggregatorlib/server/handlers"
	"github.com/cloudfoundry/noaa"
	"github.com/cloudfoundry/noaa/consumer"
	"github.com/cloudfoundry/noaa/errors"
	"github.com/cloudfoundry/noaa/test_helpers"
	"github.com/cloudfoundry/sonde-go/events"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

var _ = Describe("Consumer (Synchronous)", func() {
	var (
		cnsmr                *consumer.Consumer
		trafficControllerURL string
		testServer           *httptest.Server
		fakeHandler          *test_helpers.FakeHandler
		tlsSettings          *tls.Config

		appGuid        string
		authToken      string
		messagesToSend chan []byte
	)

	BeforeEach(func() {
		trafficControllerURL = ""
		testServer = nil
		fakeHandler = nil
		tlsSettings = nil

		appGuid = ""
		authToken = ""
		messagesToSend = make(chan []byte, 256)
	})

	JustBeforeEach(func() {
		cnsmr = consumer.New(trafficControllerURL, tlsSettings, nil)
	})

	AfterEach(func() {
		cnsmr.Close()
		if testServer != nil {
			testServer.Close()
		}
	})

	Describe("RecentLogs", func() {
		var (
			receivedLogMessages []*events.LogMessage
			recentError         error
		)

		BeforeEach(func() {
			appGuid = "appGuid"
		})

		JustBeforeEach(func() {
			close(messagesToSend)
			receivedLogMessages, recentError = cnsmr.RecentLogs(appGuid, authToken)
		})

		Context("with an invalid URL", func() {
			BeforeEach(func() {
				trafficControllerURL = "invalid-url"
			})

			It("returns an error", func() {
				Expect(recentError).ToNot(BeNil())
			})
		})

		Context("when the connection can be established", func() {
			BeforeEach(func() {
				testServer = httptest.NewServer(handlers.NewHttpHandler(messagesToSend, loggertesthelper.Logger()))
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()

				messagesToSend <- marshalMessage(createMessage("test-message-0", 0))
				messagesToSend <- marshalMessage(createMessage("test-message-1", 0))
			})

			It("returns messages from the server", func() {
				Expect(recentError).NotTo(HaveOccurred())
				Expect(receivedLogMessages).To(HaveLen(2))
				Expect(receivedLogMessages[0].GetMessage()).To(Equal([]byte("test-message-0")))
				Expect(receivedLogMessages[1].GetMessage()).To(Equal([]byte("test-message-1")))
			})
		})

		Context("when the content type is missing", func() {
			BeforeEach(func() {
				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/recentlogs", func(resp http.ResponseWriter, req *http.Request) {
					resp.Header().Set("Content-Type", "")
					resp.Write([]byte("OK"))
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a bad reponse error message", func() {
				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrBadResponse))
			})
		})

		Context("when the content length is unknown", func() {
			BeforeEach(func() {
				fakeHandler = &test_helpers.FakeHandler{
					ContentLen: "",
					InputChan:  make(chan []byte, 10),
					GenerateHandler: func(input chan []byte) http.Handler {
						return handlers.NewHttpHandler(input, loggertesthelper.Logger())
					},
				}
				testServer = httptest.NewServer(fakeHandler)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()

				fakeHandler.InputChan <- marshalMessage(createMessage("bad-content-length", 0))
				fakeHandler.Close()
			})

			It("does not throw an error", func() {
				Expect(recentError).NotTo(HaveOccurred())
				Expect(receivedLogMessages).To(HaveLen(1))
			})

		})

		Context("when the content type doesn't have a boundary", func() {
			BeforeEach(func() {
				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/recentlogs", func(resp http.ResponseWriter, req *http.Request) {
					resp.Write([]byte("OK"))
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a bad reponse error message", func() {
				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrBadResponse))
			})

		})

		Context("when the content type's boundary is blank", func() {
			BeforeEach(func() {
				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/recentlogs", func(resp http.ResponseWriter, req *http.Request) {
					resp.Header().Set("Content-Type", "boundary=")
					resp.Write([]byte("OK"))
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a bad reponse error message", func() {
				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrBadResponse))
			})

		})

		Context("when the path is not found", func() {
			BeforeEach(func() {
				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/recentlogs", func(resp http.ResponseWriter, req *http.Request) {
					resp.WriteHeader(http.StatusNotFound)
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a not found reponse error message", func() {
				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrNotFound))
			})

		})

		Context("when the authorization fails", func() {
			var failer test_helpers.AuthFailureHandler

			BeforeEach(func() {
				failer = test_helpers.AuthFailureHandler{Message: "Helpful message"}
				serverMux := http.NewServeMux()
				serverMux.Handle(fmt.Sprintf("/apps/%s/recentlogs", appGuid), failer)
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a helpful error message", func() {
				Expect(recentError).To(HaveOccurred())
				Expect(recentError.Error()).To(ContainSubstring("You are not authorized. Helpful message"))
				Expect(recentError).To(BeAssignableToTypeOf(&errors.UnauthorizedError{}))
			})
		})
	})

	Describe("ContainerMetrics", func() {
		var (
			receivedContainerMetrics []*events.ContainerMetric
			recentError              error
		)

		BeforeEach(func() {
			appGuid = "appGuid"
		})

		JustBeforeEach(func() {
			close(messagesToSend)
			receivedContainerMetrics, recentError = cnsmr.ContainerMetrics(appGuid, authToken)
		})

		Context("when the connection cannot be established", func() {
			BeforeEach(func() {
				trafficControllerURL = "invalid-url"
			})

			It("invalid urls return error", func() {
				Expect(recentError).ToNot(BeNil())
			})
		})

		Context("when the connection can be established", func() {
			BeforeEach(func() {
				testServer = httptest.NewServer(handlers.NewHttpHandler(messagesToSend, loggertesthelper.Logger()))
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			Context("with a successful connection", func() {
				BeforeEach(func() {
					messagesToSend <- marshalMessage(createContainerMetric(2, 2000))
					messagesToSend <- marshalMessage(createContainerMetric(1, 1000))
				})

				It("returns messages from the server", func() {
					Expect(recentError).NotTo(HaveOccurred())
					Expect(receivedContainerMetrics).To(HaveLen(2))
					Expect(receivedContainerMetrics[0].GetInstanceIndex()).To(Equal(int32(1)))
					Expect(receivedContainerMetrics[1].GetInstanceIndex()).To(Equal(int32(2)))
				})
			})

			Context("when trafficcontroller returns an error as a log message", func() {
				BeforeEach(func() {
					messagesToSend <- marshalMessage(createContainerMetric(2, 2000))
					messagesToSend <- marshalMessage(createMessage("an error occurred", 2000))
				})

				It("returns the error", func() {
					Expect(recentError).To(HaveOccurred())
					Expect(recentError).To(MatchError("Upstream error: an error occurred"))
				})
			})
		})

		Context("when the content type is missing", func() {
			BeforeEach(func() {
				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/containermetrics", func(resp http.ResponseWriter, req *http.Request) {
					resp.Header().Set("Content-Type", "")
					resp.Write([]byte("OK"))
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a bad reponse error message", func() {
				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrBadResponse))
			})
		})

		Context("when the content length is unknown", func() {
			BeforeEach(func() {
				fakeHandler = &test_helpers.FakeHandler{
					ContentLen: "",
					InputChan:  make(chan []byte, 10),
					GenerateHandler: func(input chan []byte) http.Handler {
						return handlers.NewHttpHandler(input, loggertesthelper.Logger())
					},
				}
				testServer = httptest.NewServer(fakeHandler)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()

				fakeHandler.InputChan <- marshalMessage(createContainerMetric(2, 2000))
				fakeHandler.Close()
			})

			It("does not throw an error", func() {
				Expect(recentError).NotTo(HaveOccurred())
				Expect(receivedContainerMetrics).To(HaveLen(1))
			})
		})

		Context("when the content type doesn't have a boundary", func() {
			BeforeEach(func() {

				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/containermetrics", func(resp http.ResponseWriter, req *http.Request) {
					resp.Write([]byte("OK"))
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a bad reponse error message", func() {

				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrBadResponse))
			})

		})

		Context("when the content type's boundary is blank", func() {
			BeforeEach(func() {

				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/containermetrics", func(resp http.ResponseWriter, req *http.Request) {
					resp.Header().Set("Content-Type", "boundary=")
					resp.Write([]byte("OK"))
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a bad reponse error message", func() {
				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrBadResponse))
			})

		})

		Context("when the path is not found", func() {
			BeforeEach(func() {

				serverMux := http.NewServeMux()
				serverMux.HandleFunc("/apps/appGuid/containermetrics", func(resp http.ResponseWriter, req *http.Request) {
					resp.WriteHeader(http.StatusNotFound)
				})
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a not found reponse error message", func() {

				Expect(recentError).To(HaveOccurred())
				Expect(recentError).To(Equal(noaa.ErrNotFound))
			})

		})

		Context("when the authorization fails", func() {
			var failer test_helpers.AuthFailureHandler

			BeforeEach(func() {
				failer = test_helpers.AuthFailureHandler{Message: "Helpful message"}
				serverMux := http.NewServeMux()
				serverMux.Handle("/apps/appGuid/containermetrics", failer)
				testServer = httptest.NewServer(serverMux)
				trafficControllerURL = "ws://" + testServer.Listener.Addr().String()
			})

			It("returns a helpful error message", func() {

				Expect(recentError).To(HaveOccurred())
				Expect(recentError.Error()).To(ContainSubstring("You are not authorized. Helpful message"))
				Expect(recentError).To(BeAssignableToTypeOf(&errors.UnauthorizedError{}))
			})
		})
	})
})
