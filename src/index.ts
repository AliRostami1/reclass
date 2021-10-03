import { launch, getStream } from "puppeteer-stream";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { format } from "date-fns";
import ffmpeg from "fluent-ffmpeg";

import { createWriteStream } from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

interface Klass {
	[key: string]: string | boolean;
	name: string;
	time: string;
	biweekly: boolean;
}

const exampleklass: Klass = {
	name: "طراحی کامپیوتر سیستمهای دیجیتال",
	time: "19:00",
	biweekly: true,
};

async function test() {
	const browser = await launch({
		defaultViewport: {
			width: 0,
			height: 0,
		},
		args: ["--start-maximized"],
		executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
	});
	process.on("beforeExit", () => {
		browser.close();
	});

	const isBrowserOpen = async () => {
		const pages = await browser.pages();
		return pages.length !== 0;
	};
	const pages = await browser.pages();
	const page = pages[0];

	let loggedIn = false;
	while (!loggedIn && (await isBrowserOpen())) {
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

	while (await isBrowserOpen()) {
		await page.goto("http://mashhad.daan.ir/session-list");

		await page.waitForSelector("div.examBox");

		const klassBtnHandle = await page.evaluateHandle((exampleklass: Klass) => {
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
				if (name === exampleklass.name) {
					if (exampleklass.biweekly) {
						if (title !== name) {
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
				return elements[thisIsIt].querySelector(
					'button.btn.examBtn.resultBtn[type="submit"]'
				);
			}
		}, exampleklass);

		const klassBtn = klassBtnHandle.asElement();
		if (klassBtn) {
			klassBtn.click();
		} else {
			console.log("failed finding the class, trying again after 2 minutes...");
			await page.waitForTimeout(1000 * 60 * 2);
			continue;
		}

		await page.waitForTimeout(10000);
		const url = page.url();
		const res = url.match(/class(\d)+\.daan\.ir/);
		if (res) {
			console.log("enterd class");
			break;
		} else {
			console.log("failed entering class, trying again after one minute...");
			await page.waitForTimeout(1000 * 60);
			continue;
		}
	}

	const basePath = "./out/";
	const videoName = `${exampleklass.name}-${format(Date.now(), "yyyy-MM-dd")}`;
	const plainVideoPath = `${basePath}${videoName}.mp4`;
	const x265VideoPath = `${basePath}${videoName}-x265.mp4`;
	const file = createWriteStream(plainVideoPath);
	const stream = await getStream(page, { audio: true, video: true });
	const exitProcedure = async () => {
		await stream.destroy();
		console.log("stopped recording");
		file.close();
		console.log("file saved!");
		ffmpeg(plainVideoPath)
			.fps(24)
			.format("mp4")
			.videoCodec("libx265")
			.addOption(["-crf 20", "-max_muxing_queue_size 512"])
			.save(x265VideoPath)
			.on("start", () => {
				console.log(" ------- started  ------- ");
			})
			.on("stderr", (err) => {
				console.error(err);
			})
			.on("end", () => {
				console.log("  ------- finished  ------- ");
				process.exit(0);
			});
	};
	console.log("started recording");

	const audioBtn = await page.waitForSelector(
		'button.jumbo--Z12Rgj4.buttonWrapper--x8uow.audioBtn--1H6rCK[aria-label="تنها شنونده"]',
		{ timeout: 15000 }
	);
	if (audioBtn) {
		audioBtn.click();
	} else {
		throw "audio button doesnt exist";
	}

	setTimeout(async () => {
		await exitProcedure();
	}, 1000 * 60 * 90);

	while (await isBrowserOpen()) {
		await page.waitForTimeout(1000 * 60);
		const endModal = await page.$("modal--MalHB");
		if (endModal) {
			await exitProcedure();
		}
	}
}

test();
