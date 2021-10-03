type CallbackFn = (signal: NodeJS.Signals) => void;

export function addEventListener(fn: CallbackFn) {
	process.on("beforeExit", fn);
}
