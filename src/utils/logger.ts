type LogLevel = "debug" | "info" | "warn" | "error";

const COLORS: Record<LogLevel, string> = {
	debug: "\x1b[36m",
	info: "\x1b[32m",
	warn: "\x1b[33m",
	error: "\x1b[31m",
};

const RESET = "\x1b[0m";

const log = (level: LogLevel, message: string, meta?: unknown) => {
	const timestamp = new Date().toISOString();
	const color = COLORS[level];
	const extra = meta === undefined ? "" : ` ${JSON.stringify(meta)}`;

	console[level === "debug" ? "log" : level](
		`${color}[${timestamp}] ${level.toUpperCase()}${RESET} ${message}${extra}`,
	);
};

export const logger = {
	debug: (message: string, meta?: unknown) => log("debug", message, meta),
	info: (message: string, meta?: unknown) => log("info", message, meta),
	warn: (message: string, meta?: unknown) => log("warn", message, meta),
	error: (message: string, meta?: unknown) => log("error", message, meta),
};
