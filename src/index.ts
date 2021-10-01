import { launch, getStream } from "puppeteer-stream";
import fs from "fs";

const file = fs.createWriteStream("./out/video.mp4");

async function test() {
	const browser = await launch({
		defaultViewport: {
			width: 1920,
			height: 1080,
		},
	});

	const page = await browser.newPage();

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
			continue;
		}
	}

	await page.goto("http://mashhad.daan.ir/session-list");

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
