describe('Smoke test', function () {

  it('should have a title', function () {
    browser.get('http://172.17.0.1/');
    expect(browser.getTitle()).toEqual('');
  });

});

