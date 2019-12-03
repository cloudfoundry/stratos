package stringutils

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

func TestUtils(t *testing.T) {

	var str1 = []string{"one", "two", "three"}

	Convey("ArrayContainsString", t, func() {
		So(ArrayContainsString(str1, "two"), ShouldBeTrue)
		So(ArrayContainsString(str1, "four"), ShouldBeFalse)
		So(ArrayContainsString(str1, ""), ShouldBeFalse)
		So(ArrayContainsString(nil, "test"), ShouldBeFalse)
	})

	Convey("RemoveSpaces", t, func() {
		So(RemoveSpaces("test"), ShouldEqual, "test")
		So(RemoveSpaces(" test"), ShouldEqual, "test")
		So(RemoveSpaces("test "), ShouldEqual, "test")
		So(RemoveSpaces(" test"), ShouldEqual, "test")
		So(RemoveSpaces(" test one two three"), ShouldEqual, "testonetwothree")
	})

}
