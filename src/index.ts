import { launch, getStream } from "puppeteer-stream";
import fs from "fs";

const file = fs.createWriteStream("./out/video.mp4");
// const logFile = fs.createWriteStream("./out/log.txt");
interface Klass {
	[key: string]: string | boolean;
	name: string;
	time: string;
	biweekly: boolean;
}

const exampleklass: Klass = {
	name: "آزمایشگاه سیستم‌های عامل",
	time: "18:00",
	biweekly: false,
};

async function test() {
	const browser = await launch({
		defaultViewport: {
			width: 1920,
			height: 1080,
		},
		args: ["--start-maximized"],
	});

	const pages = await browser.pages();
	const page = pages[0];

	let loggedIn = false;
	while (!loggedIn) {
		try {
			await page.goto(
				"http://mashhad.daan.ir/login-identification-form#login-identification-form"
			);

			const usernameInput = await page.waitForSelector(
				"input#identificationNumber"
			);
			if (usernameInput) {
				await usernameInput.type("11139802563", { delay: 100 });
			} else {
				throw "usernameInput doesn't exist";
			}

			const passInput = await page.waitForSelector("input#password");
			if (passInput) {
				await passInput.type("12AlI1234", { delay: 100 });
			} else {
				throw "passInput doesn't exist";
			}

			const btn = await page.waitForSelector("button.btn.btn-primary");
			if (btn) {
				btn.click();
			} else {
				throw "btn doesn't exist";
			}

			const visible = await page.waitForSelector(
				"div.tileHolder.meeting.student",
				{
					timeout: 10000,
				}
			);
			if (visible) {
				loggedIn = true;
			}
		} catch {
			console.log("login failed, trying again...");
			continue;
		}
	}

	console.log("logged in successfuly");

	// await page.goto("http://mashhad.daan.ir/session-list");
	await page.goto("http://mashhad.daan.ir/session-list?date=1400%2F07%2F10");

	await page.waitForSelector("div.examBox");

	const klassBtnHandle = await page.evaluateHandle((exampleklass) => {
		const elements = document.querySelectorAll("div.examBox");
		if (elements.length === 0) {
			// there is no class
			return;
		}

		let thisIsIt = -1;

		elements.forEach((el, index) => {
			const contentDiv = el.children[1];
			const name = contentDiv.children[0].children[0].children[2].textContent;
			const time = contentDiv.children[1].children[1].children[2].textContent;
			if (name === exampleklass.name) {
				if (exampleklass.biweekly) {
					if (time !== exampleklass.time) {
						thisIsIt = index;
					}
				} else {
					if (time === exampleklass.time) {
						thisIsIt = index;
					}
				}
			}
		});
		if (thisIsIt !== -1) {
			return elements[thisIsIt].querySelector("a.btn.examBtn");
		} else {
			throw "didn't find the class";
		}
	}, exampleklass);

	const klassBtn = klassBtnHandle.asElement();
	if (klassBtn) {
		klassBtn.click();
	} else {
		throw "klass button doesn't exist";
	}

	const stream = await getStream(page, { audio: true, video: true });

	console.log("recording");
	stream.pipe(file);
	setTimeout(async () => {
		await stream.destroy();
		file.close();
		console.log("finished");
		browser.close();
	}, 1000 * 100);
}

test();
