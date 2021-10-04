import { launch, getStream } from "puppeteer-stream";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { format } from "date-fns";
import ffmpeg from "fluent-ffmpeg";
import { createInterface } from "readline";

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

import { createWriteStream } from "fs";
import { count } from "console";

ffmpeg.setFfmpegPath(ffmpegPath);

interface Klass {
	[key: string]: string | boolean;
	name: string;
	time: string;
	biweekly: boolean;
}

const exampleklass: Klass = {
	name: "s طراحی کامپایلر",
	time: "10:00",
	biweekly: false,
};

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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

	while (await isBrowserOpen()) {
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
				await Promise.all([
					btn.click(),
					page.waitForNavigation({ waitUntil: "networkidle2" }),
				]);
				const url = await page.url();
				if (url === "http://mashhad.daan.ir/class-dashboard") {
					break;
				} else {
					throw "login failed";
				}
			} else {
				throw "btn doesn't exist";
			}
		} catch (e) {
			console.error(e);
			console.log("login failed, trying again...");
			continue;
		}
	}
	console.log("logged in successfuly");

	while (await isBrowserOpen()) {
		try {
			await page.goto("http://mashhad.daan.ir/session-list");

			await page.waitForSelector("div.examBox");

			const klassBtnHandle = await page.evaluateHandle(
				(exampleklass: Klass) => {
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
				},
				exampleklass
			);

			const klassBtn = klassBtnHandle.asElement();

			if (klassBtn) {
				await Promise.all([
					klassBtn.click(),
					page.waitForNavigation({ waitUntil: "networkidle2" }),
				]);
			} else {
				throw "klassBtn not found";
			}
			const url = page.url();
			const res = url.match(/class(\d)+\.daan\.ir/);
			if (res) {
				console.log("enterd class");
				break;
			} else {
				throw "failed entering the class";
			}
		} catch (e) {
			console.error(e);
			console.log("failed entering the class, trying again in 2 minutes...");
			await delay(1000 * 60 * 2);
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
		await delay(1000 * 60);

		ffmpeg(plainVideoPath)
			.fps(24)
			.format("mp4")
			.videoCodec("libx265")
			.addOption(["-crf 20", "-max_muxing_queue_size 512"])
			.save(x265VideoPath)
			.on("start", () => {
				console.log(" ------- started compressing ------- ");
			})
			.on("stderr", (err) => {
				console.error(err);
			})
			.on("end", () => {
				console.log("  ------- finished compressing ------- ");
				process.exit(0);
			});
	};
	console.log("started recording");

	rl.on("line", async (input) => {
		if (input === "stop") {
			await exitProcedure();
		}
	});

	setTimeout(async () => {
		console.log("reached limit");
		await exitProcedure();
	}, 1000 * 60 * 90);

	(async () => {
		while (await isBrowserOpen()) {
			try {
				const audioBtn = await page.$(
					'button.jumbo--Z12Rgj4.buttonWrapper--x8uow.audioBtn--1H6rCK[aria-label="تنها شنونده"]'
				);
				if (audioBtn) {
					audioBtn.click();
				}
				const endModal = await page.$("div.modal--MalHB");
				if (endModal) {
					console.log("encountered end of class");
					await exitProcedure();
				}
				await delay(1000 * 60);
			} catch (e) {
				console.log(e);
				await delay(1000 * 60);
				continue;
			}
		}
	})();

	await delay(1000 * 60 * 20);
	await (async () => {
		let counter = 0;
		while (await isBrowserOpen()) {
			try {
				const users = await page.$$("div.userListItem--Z1qtuLG");
				if (users.length < 5) {
					console.log("there are less than 5 people in the class");
					counter += 1;
				} else {
					counter = 0;
				}
				if (counter >= 2) {
					await exitProcedure();
				}
				await delay(1000 * 60);
			} catch (e) {
				console.log(e);
				await delay(1000 * 60);
				continue;
			}
		}
	})();
}

test();
