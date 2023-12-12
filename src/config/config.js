// Config Server
const PORT = process.env.PORT || "3000";
const APP_URL = process.env.APP_URL || "";
const LOG_LEVEL = process.env.LOG_LEVEL;
const WA_ADMIN = process.env.WA_ADMIN;
const DEBUG_QUERY = process.env.NODE_ENV == "development" ? ["query", "info", "warn", "error"] : [];

// WHATSAPP BAILEYS CONFIGURATION
const RESTORE_SESSIONS_ON_START_UP = process.env.RESTORE_SESSIONS_ON_START_UP ? true : false;
const RESTORE_SESSIONS_DELAY = process.env.RESTORE_SESSIONS_DELAY || 20; // detik
const INSTANCE_MAX_RETRY_QR = process.env.INSTANCE_MAX_RETRY_QR || 2;
const QRCODE_TIME_OUT = process.env.QRCODE_TIME_OUT || 34;
const MARK_MESSAGES_READ = process.env.MARK_MESSAGES_READ == "true" ? true : false;

const CLIENT_PLATFORM = process.env.CLIENT_PLATFORM || "Whatsapp MD";
const CLIENT_BROWSER = process.env.CLIENT_BROWSER || "Chrome";
const CLIENT_VERSION = process.env.CLIENT_VERSION || "4.0.0";

// Device WABOT untuk notifikasi dari sistem
const WABOT = process.env.WABOT;

module.exports = {
  port: PORT,
  appUrl: APP_URL,
  debugQuery: DEBUG_QUERY,
  waAdmin: WA_ADMIN,
  wabot: WABOT,
  restoreSessionsOnStartup: RESTORE_SESSIONS_ON_START_UP,
  restoreDelay: RESTORE_SESSIONS_DELAY,
  qrTimout: QRCODE_TIME_OUT,
  log: {
    level: LOG_LEVEL,
  },
  instance: {
    maxRetryQr: INSTANCE_MAX_RETRY_QR,
  },
  browser: {
    platform: CLIENT_PLATFORM,
    browser: CLIENT_BROWSER,
    version: CLIENT_VERSION,
  },
  markMessagesRead: MARK_MESSAGES_READ,
};
