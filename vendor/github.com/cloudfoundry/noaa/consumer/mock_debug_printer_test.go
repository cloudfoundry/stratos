package consumer_test

type mockDebugPrinter struct {
	PrintCalled chan bool
	PrintInput  struct {
		Title, Dump chan string
	}
}

func newMockDebugPrinter() *mockDebugPrinter {
	m := &mockDebugPrinter{}
	m.PrintCalled = make(chan bool, 100)
	m.PrintInput.Title = make(chan string, 100)
	m.PrintInput.Dump = make(chan string, 100)
	return m
}
func (m *mockDebugPrinter) Print(title, dump string) {
	m.PrintCalled <- true
	m.PrintInput.Title <- title
	m.PrintInput.Dump <- dump
}
