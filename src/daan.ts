import { Page, Browser } from "puppeteer-core";

import { isBrowserOpen } from "./page";
import { getEnv } from "./env";
import { delay } from "./util";

export interface Klass {
  [key: string]: string | boolean;
  name: string;
  time: string;
  biweekly: boolean;
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

export async function enterTheClass(
  browser: Browser,
  page: Page,
  klass: Klass
) {
  while (await isBrowserOpen(browser)) {
    try {
      if (await isInClass(page)) {
        break;
      }
      await page.goto("http://mashhad.daan.ir/session-list");

      await page.waitForSelector("div.examBox");

      const klassBtnHandle = await page.evaluateHandle((klass: Klass) => {
        const elements = document.querySelectorAll("div.examBox");
        if (elements.length === 0) {
          // there is no class
          return;
        }

        let thisIsIt = -1;

        elements.forEach((el, index) => {
          const title = el.children[0].children[2].textContent;
          const name =
            el.children[1].children[0].children[0].children[2].textContent;
          const time =
            el.children[1].children[1].children[1].children[2].textContent;
          if (name === klass.name) {
            if (klass.biweekly) {
              if (title !== name) {
                thisIsIt = index;
              }
            } else {
              if (time === klass.time) {
                thisIsIt = index;
              }
            }
          }
        });
        if (thisIsIt !== -1) {
          return elements[thisIsIt].querySelector(
            'button.btn.examBtn.resultBtn[type="submit"]'
          );
        }
      }, klass);

      const klassBtn = klassBtnHandle.asElement();

      if (klassBtn) {
        await Promise.all([
          klassBtn.click(),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);
      } else {
        throw "klassBtn not found";
      }

      if (await isInClass(page)) {
        console.log("enterd class");
        break;
      } else {
        throw "failed entering the class";
      }
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
