package analysis

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"time"

	"github.com/cloudfoundry-community/stratos/src/jetstream/plugins/analysis/store"

	"github.com/labstack/echo/v4"
	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
)

type popeyeConfig struct {
	Namespace string `json:"namespace"`
	App       string `json:"app"`
}

type KubeConfigExporter interface {
	GetKubeConfigForEndpointUser(endpointID, userID string) (string, error)
}

const idHeaderName = "X-Stratos-Analaysis-ID"

func (c *Analysis) runReport(ec echo.Context) error {
	log.Debug("runReport")

	analyzer := ec.Param("analyzer")
	endpointID := ec.Param("endpoint")
	userID := ec.Get("user_id").(string)

	// Look up the endpoint for the user
	var p = c.portalProxy
	endpoint, err := p.GetCNSIRecord(endpointID)
	if err != nil {
		return errors.New("Could not get endpoint information")
	}

	report := store.AnalysisRecord{
		ID:           uuid.NewV4().String(),
		EndpointID:   endpointID,
		EndpointType: endpoint.CNSIType,
		UserID:       userID,
		Path:         "",
		Created:      time.Now(),
		Read:         false,
		Duration:     0,
		Status:       "pending",
		Result:       "",
	}

	// Create a record in the reports datastore
	dbStore, err := store.NewAnalysisDBStore(p.GetDatabaseConnection())
	if err != nil {
		return err
	}

	report.Name = fmt.Sprintf("Analysis report %s", analyzer)
	dbStore.Save((report))

	err = c.doRunReport(ec, analyzer, endpointID, userID, dbStore, &report)
	if err != nil {
		report.Status = "error"
		report.Result = err.Error()
		dbStore.UpdateReport(userID, &report)
	}

	return err

}

func (c *Analysis) doRunReport(ec echo.Context, analyzer, endpointID, userID string, dbStore store.AnalysisStore, report *store.AnalysisRecord) error {

	// Get Kube Config
	k8s := c.portalProxy.GetPlugin("kubernetes")
	if k8s == nil {
		return errors.New("Could not find Kubernetes plugin")
	}

	k8sConfig, ok := k8s.(KubeConfigExporter)
	if !ok {
		return errors.New("Could not find Kubernetes plugin interface")
	}

	config, err := k8sConfig.GetKubeConfigForEndpointUser(endpointID, userID)
	if err != nil {
		return errors.New("Could not get Kube Config for the endpoint")
	}

	id := fmt.Sprintf("%s/%s/%s", userID, endpointID, report.ID)

	// Create a multi-part form to send to the analyzer container
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	// Add kube config
	metadataHeader := textproto.MIMEHeader{}
	metadataHeader.Set("Content-Type", "application/yaml")
	metadataHeader.Set("Content-ID", "kubeconfig")
	part, _ := writer.CreatePart(metadataHeader)
	part.Write([]byte(config))

	requestBody := make([]byte, 0)

	// Read body
	defer ec.Request().Body.Close()
	if b, err := ioutil.ReadAll((ec.Request().Body)); err == nil {
		requestBody = b
	}

	// Content that was posted to us
	postHeader := textproto.MIMEHeader{}
	postHeader.Set("Content-Type", "application/json")
	postHeader.Set("Content-ID", "body")
	part, _ = writer.CreatePart(postHeader)
	part.Write(requestBody)

	// Report config
	reportHeader := textproto.MIMEHeader{}
	reportHeader.Set("Content-Type", "application/json")
	reportHeader.Set("Content-ID", "job")
	part, _ = writer.CreatePart(reportHeader)
	job, err := json.Marshal(report)
	if err != nil {
		return errors.New("Could not serialize job")
	}
	part.Write(job)
	writer.Close()

	// Post this to the Analyzer API
	contentType := fmt.Sprintf("multipart/form-data; boundary=%s", writer.Boundary())
	uploadURL := fmt.Sprintf("%s/api/v1/run/%s", c.analysisServer, analyzer)
	r, _ := http.NewRequest(http.MethodPost, uploadURL, bytes.NewReader(body.Bytes()))
	r.Header.Set("Content-Type", contentType)
	r.Header.Set(idHeaderName, id)
	client := &http.Client{Timeout: 180 * time.Second}
	rsp, err := client.Do(r)
	if err != nil {
		return errors.New("Analysis job failed - could not contact Analysis Server")
	}

	if rsp.StatusCode != http.StatusOK {
		log.Debugf("Request failed with response code: %d", rsp.StatusCode)
		return fmt.Errorf("Analysis job failed with response code: %d", rsp.StatusCode)
	}

	// Job submitted okay
	// Updated job is in the response

	defer rsp.Body.Close()
	response, err := ioutil.ReadAll(rsp.Body)
	if err != nil {
		return errors.New("Could not read response")
	}

	updatedJob := store.AnalysisRecord{}
	if err = json.Unmarshal(response, &updatedJob); err != nil {
		return errors.New("Could not read response - could not deserialize response")
	}

	report.Duration = updatedJob.Duration
	report.Status = updatedJob.Status
	report.Name = updatedJob.Name
	report.Format = updatedJob.Format
	report.Type = updatedJob.Type
	report.Path = updatedJob.Path

	log.Debug("OK => Job submitted okay")
	log.Debug("=======================================================")
	log.Debugf("%+v", report)
	log.Debug("=======================================================")

	err = dbStore.UpdateReport(userID, report)
	if err != nil {
		return fmt.Errorf("Could not save report %s", err)
	}

	log.Debug("All done - job saved")

	return ec.JSON(200, report)
}
