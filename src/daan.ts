import { Page, Browser } from "puppeteer-core";
import { isBrowserOpen } from "./page";
import { getEnv } from "./env";
import { delay, hhmmToDate, biweeklyToNormal } from "./util";

export interface OldKlass {
  name: string;
  time: string;
  biweekly: boolean;
}
export interface Klass {
  name: string;
  time: Date;
  title: string;
  enterable: boolean;
}

export async function login(browser: Browser, page: Page) {
  while (await isBrowserOpen(browser)) {
    try {
      // check if it's already logged in
      if (await isLoggedin(page)) {
        break;
      }

      // go to login page
      await page.goto(
        "http://mashhad.daan.ir/login-identification-form#login-identification-form"
      );

      // get the username field and fill it
      const usernameInput = await page.waitForSelector(
        "input#identificationNumber"
      );
      if (usernameInput) {
        await usernameInput.type(getEnv("DAAN_USERNAME"), { delay: 100 });
      } else {
        throw "usernameInput doesn't exist";
      }

      // get the password field and fill it
      const passInput = await page.waitForSelector("input#password");
      if (passInput) {
        await passInput.type(getEnv("DAAN_PASSWORD"), { delay: 100 });
      } else {
        throw "passInput doesn't exist";
      }

      // get the login button and click it
      const btn = await page.waitForSelector("button.btn.btn-primary");
      if (btn) {
        await Promise.all([
          btn.click(),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);
        // if we're logged in (based on url) then break out of the loop
        // otherwise throw an exception
        if (await isLoggedin(page)) {
          break;
        } else {
          throw "failed entering the class";
        }
      } else {
        throw "couldn't find the class";
      }
    } catch (e) {
      console.error(e);
      console.log("trying again in one minute...");
      continue;
    }
  }
  console.log("logged in successfuly");
}

export async function isLoggedin(page: Page) {
  const url = await page.url();
  if (url === "http://mashhad.daan.ir/class-dashboard") {
    return true;
  } else {
    return false;
  }
}

export async function enterTheClass(browser: Browser, klass: Klass) {
  while (await isBrowserOpen(browser)) {
    try {
      const page = await browser.newPage();
      await page.goto("http://mashhad.daan.ir/session-list");
      await page.waitForSelector("div.examBox");
      const button = await page.evaluateHandle("div.examBox", (els) => {
        return els.map((el) => {
          return {
            title: el.children[0].children[2].textContent as string,
            name: el.children[1].children[0].children[0].children[2]
              .textContent as string,
            time: el.children[1].children[1].children[1].children[2]
              .textContent as string,
            enterable: !!el.querySelector(
              'button.btn.examBtn.resultBtn[type="submit"]'
            ),
          };
        });
      });
    } catch (e) {
      console.error(e);
      console.log("trying again in a minute...");
      await delay(1000 * 60);
      continue;
    }
  }
}

export async function isInClass(page: Page) {
  const url = page.url();
  const res = url.match(/class(\d)+\.daan\.ir/);
  return !!res;
}

export async function listKlasses(page: Page) {
  await page.goto("http://mashhad.daan.ir/session-list");

  await page.waitForSelector("div.examBox");

  const data = await page.$$eval("div.examBox", (els) => {
    return els.map((el) => {
      return {
        title: el.children[0].children[2].textContent as string,
        name: el.children[1].children[0].children[0].children[2]
          .textContent as string,
        time: el.children[1].children[1].children[1].children[2]
          .textContent as string,
        enterable: !!el.querySelector(
          'button.btn.examBtn.resultBtn[type="submit"]'
        ),
      };
    });
  });
  return data.map((el): Klass => {
    return {
      ...el,
      time: hhmmToDate(biweeklyToNormal(el.time)),
    };
  });
}
