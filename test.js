import { chromium } from 'k6/experimental/browser';
import { check } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js";

export let options = {
  vus: 1,
  iterations: 1
};

export default async function () {
  const { browser, page } = launchBrowser();

  await login(page, 'standard_user', 'secret_sauce');
  await addToCart(page,'Sauce Labs Bike Light');
  await checkout(page,'Luke','Skywalker','1234');
  closeBrowser(browser);
}

export function handleSummary(data) {
  return {
    'TestSummaryReport.html': htmlReport(data, { debug: true })
  };
}

function launchBrowser() {
  const browser = chromium.launch({ headless: true });
  const context = browser.newContext();
  const page = context.newPage();
  return { browser, page };
}

async function login(page, username, password) {
  await page.goto('https://www.saucedemo.com/');
  await page.locator("//input[@placeholder='Username']").type(username);
  await page.locator("//input[@placeholder='Password']").type(password);
  const submitButton =  page.locator("//input[@id='login-button']");
  await Promise.all([page.waitForNavigation(), submitButton.click()]);
  check(page, {'Verify user is logged In': () =>
      page.locator("//span[@class='title']").textContent() == 'Products',
  });
}

async function addToCart(page, product) {
    await page.locator("//div[text()='"+product+"']/following::button[1]").click();
    await page.screenshot({ path: 'screenshots/products.png' });
    const cartIcon =  page.locator("//*[@id='shopping_cart_container']/a");
    await Promise.all([page.waitForNavigation(), cartIcon.click()]);
    check(page, {'Verify item is added to the cart': () =>
      page.locator("//*[@class='inventory_item_name']").textContent() == product,
   });
}

async function checkout(page, fname, lname, zip) {
  const checkout =  page.locator("//button[@id='checkout']");
  await Promise.all([page.waitForNavigation(), checkout.click()]);
  
  await page.locator("//input[@placeholder='First Name']").type(fname);
  await page.locator("//input[@placeholder='Last Name']").type(lname);
  await page.locator("//input[@placeholder='Zip/Postal Code']").type(zip);

  const continuebtn =  page.locator("//*[@id='continue']");
  await Promise.all([page.waitForNavigation(), continuebtn.click()]);

  check(page, {'Verify checkout page': () =>
      page.locator("//*[@class='title']").textContent() == 'Checkout: Overview',
  });
  const finish =  page.locator("//button[@id='finish']");
  await Promise.all([page.waitForNavigation(), finish.click()]);

  check(page, {'Verify success message': () =>
  page.locator("//*[@class='complete-header']").textContent() == 'Thank you for your order!',
  });
    await page.screenshot({ path: 'screenshots/successmessage.png' });
  }

function closeBrowser(browser) {
  browser.close();
}
