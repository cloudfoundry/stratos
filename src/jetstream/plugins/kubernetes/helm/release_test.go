package helm

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"

	log "github.com/sirupsen/logrus"
)

func TestPodSelector(t *testing.T) {

	Convey("TestPodSelector", t, func() {

		t1 := KubeDeploymentResource{}
		t1.Spec.Selector.MatchLabels = make(map[string]string)
		t1.Spec.Selector.MatchLabels["environemnt"] = "dev"

		res := podSelectorToQueryString(t1)

		log.Info(res)

		// So(ArrayContainsString(str1, "two"), ShouldBeTrue)
		// So(ArrayContainsString(str1, "four"), ShouldBeFalse)
		// So(ArrayContainsString(str1, ""), ShouldBeFalse)
		// So(ArrayContainsString(nil, "test"), ShouldBeFalse)
	})

}
