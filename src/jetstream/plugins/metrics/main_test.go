package metrics

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

func TestUrlComparision(t *testing.T) {
	t.Parallel()

	Convey("URL Comparision", t, func() {

		So(compareURL("https://test.com", "https://test.com"), ShouldBeTrue)
		So(compareURL("http://test.com", "http://test.com"), ShouldBeTrue)
		So(compareURL("http://test3.com", "http://test.com"), ShouldBeFalse)
		So(compareURL("https://test.com", "https://test.com:443"), ShouldBeTrue)
		So(compareURL("http://test.com", "https://test.com:443"), ShouldBeFalse)
		So(compareURL("http://test.com", "http://test.com:80"), ShouldBeTrue)
		So(compareURL("http://test.com:80", "http://test.com:80"), ShouldBeTrue)
		So(compareURL("http://test.com:80", "http://test.com"), ShouldBeTrue)
		So(compareURL("http://test.com", "http://test2.com"), ShouldBeFalse)
		So(compareURL("http://test.com/a", "http://test.com/a"), ShouldBeTrue)
		So(compareURL("http://test.com/a?one=two", "http://test.com/a?two=one"), ShouldBeTrue)

	})

}
