package vala

import (
	"fmt"
	"reflect"
	"strings"
)

type Checker func() (checkerIsTrue bool, errorMessage string)

type Validation struct {
	Errors []string
}

func BeginValidation() *Validation {
	return nil
}

func (val *Validation) Check() error {
	if val == nil || len(val.Errors) <= 0 {
		return nil
	}

	return val.constructErrorMessage()
}

func (val *Validation) CheckAndPanic() *Validation {
	if val == nil || len(val.Errors) <= 0 {
		return val
	}

	panic(val.constructErrorMessage())
}

func (val *Validation) CheckSetErrorAndPanic(retError *error) *Validation {
	if val == nil || len(val.Errors) <= 0 {
		return val
	}

	*retError = val.constructErrorMessage()
	panic(*retError)
}

func (val *Validation) Validate(checkers ...Checker) *Validation {

	for _, checker := range checkers {
		if pass, msg := checker(); !pass {
			if val == nil {
				val = validationFactory(1)
			}

			val.Errors = append(val.Errors, msg)
		}
	}

	return val
}

func (val *Validation) constructErrorMessage() error {
	return fmt.Errorf(
		"Parameter validation failed:\t%s",
		strings.Join(val.Errors, "\n\t"),
	)
}

//
// Checker functions
//

func Not(checker Checker) Checker {

	return func() (passed bool, errorMessage string) {
		if passed, errorMessage = checker(); passed {
			return false, fmt.Sprintf("Not(%s)", errorMessage)
		}

		return true, ""
	}
}

func Equals(lhs, rhs interface{}, paramName string) Checker {

	return func() (pass bool, errMsg string) {
		return (lhs == rhs), fmt.Sprintf("Parameters were not equal: %v, %v", lhs, rhs)
	}
}

func IsNotNil(obtained interface{}, paramName string) Checker {
	return func() (isNotNil bool, errMsg string) {

		if obtained == nil {
			isNotNil = false
		} else if str, ok := obtained.(string); ok {
			isNotNil = str != ""
		} else {
			switch v := reflect.ValueOf(obtained); v.Kind() {
			case
				reflect.Chan,
				reflect.Func,
				reflect.Interface,
				reflect.Map,
				reflect.Ptr,
				reflect.Slice:
				isNotNil = !v.IsNil()
			default:
				panic("Vala is unable to check this type for nilability at this time.")
			}
		}

		return isNotNil, "Parameter was nil: " + paramName
	}
}

func HasLen(param interface{}, desiredLength int, paramName string) Checker {

	return func() (hasLen bool, errMsg string) {
		hasLen = desiredLength == reflect.ValueOf(param).Len()
		return hasLen, "Parameter did not contain the correct number of elements: " + paramName
	}
}

func GreaterThan(param int, comparativeVal int, paramName string) Checker {

	return func() (isGreaterThan bool, errMsg string) {
		if isGreaterThan = param > comparativeVal; !isGreaterThan {
			errMsg = fmt.Sprintf(
				"Parameter's length was not greater than:  %s(%d) < %d",
				paramName,
				param,
				comparativeVal)
		}

		return isGreaterThan, errMsg
	}
}

func StringNotEmpty(obtained, paramName string) Checker {
	return func() (isNotEmpty bool, errMsg string) {
		isNotEmpty = obtained != ""
		errMsg = fmt.Sprintf("Parameter is an empty string: %s", paramName)
		return
	}
}

func validationFactory(numErrors int) *Validation {
	return &Validation{make([]string, numErrors)}
}
