import { AppPage } from './app.po';
import { LoginPage } from './login/login.po';

describe('App', () => {
  let page: AppPage;
  let loginPage: LoginPage;

  beforeEach(() => {
    page = new AppPage();
    loginPage = new LoginPage();
  });

  it('- should reach log in page', () => {
    page.navigateTo();
    expect<any>(loginPage.isLoginPage()).toBeTruthy();
  });
});
