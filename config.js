const fs = require('fs');
const path = require('path');
const os = require('os');
const chrome = require('selenium-webdriver/chrome');
const log4js = require('log4js');
const { By } = require('selenium-webdriver');


// Ensure the output/log directory exists
const logDir = path.resolve(__dirname, './output', 'log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ─── SERVICES CONFIGURATION ──────────────────────────────────────────────
const services = {
  openloop: {
    loginUrl: "chrome-extension://effapmdildnpkiaeghlkicpfflpiambm/dist/popup/index.html",
    extensionUrl: "chrome-extension://effapmdildnpkiaeghlkicpfflpiambm/dist/popup/index.html",
    selectors: {
      continueButton: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/a/button'),
      usernameInput: By.css('.el-input-wrapper[type="email"] > .relative > input.el-input'),
      passwordInput: By.css('.el-input-wrapper[type="password"] > .relative > input.el-input'),
      loginButton: By.css('.btn.btn-white.mt-3'),
      loginConfirmElement: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[3]/div/div/div/div[1]/a/img'),
      status: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[1]/span'),
      quality: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[2]/div[1]/span'),
      earnings: By.xpath('//*[@id="app"]/div/div/div[1]/div/div/div[2]/div[2]/div[2]/span')
    }
  },
  gradient: {
    loginUrl: "https://app.gradient.network/",
    extensionUrl: "chrome-extension://caacbgbklghmpodbdafajbgdnegacfmo/popup.html",
    selectors: {
      usernameInput: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[1]/input'),
      passwordInput: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[2]/span/input'),
      loginButton: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[4]/button[1]'),
      loginConfirmElement: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[3]/div/div[2]'),
      dashboardElement: By.xpath('/html/body/div[1]/div[1]/div[2]/main/div/div/div[1]'),
      gotItButton: By.xpath('/html/body/div[3]/div/div[2]/div/div[1]/div/div/div/button'),
      yesButton: By.xpath('/html/body/div[2]/div/div[2]/div/div[1]/div/div/div/button'),
      rewardSwitchButton: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[3]/div/div[3]'),
      status: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[1]/div[2]/div[3]/div[2]/div/div[2]/div'),
      tapToday: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]'),
      uptime: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]'),
      todayReward: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]'),
      sessionReward: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]')
    }
  },
  toggle: {
    loginUrl: "https://toggle.pro/sign-in",
    extensionUrl: "chrome-extension://bnkekngmddejlfdeefjilpfdhomeomgb/index.html",
    selectors: {
      usernameInput: By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/div[1]/div/input'),
      passwordInput: By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/div[2]/div/input'),
      loginButton: By.xpath('/html/body/div/div[1]/div/div/div/div[5]/form/button/div'),
      loginConfirmElement: By.xpath('//*[@id="root"]/div/div/div[4]/p'),
      dashboardElement: By.xpath('/html/body/div/div[1]/div[2]/div[1]/div[1]/h1'),
      quality: By.xpath('//*[@id="root"]/div/div/div[2]/div/div/div/p'),
      epoch: By.xpath('//*[@id="root"]/div/div/div[4]/div[1]/p'),
      uptime: By.xpath('//*[@id="root"]/div/div/div[4]/div[2]/p')
    }
  },
  bless: {
    loginUrl: "https://bless.network/dashboard?ref=Y06FN1",
    extensionUrl: "https://bless.network/dashboard",
    selectors: {
      emailInput: By.xpath('//*[@id="email"]'),
      loginButton: By.xpath('/html/body/div/main/div/div/div[2]/div[3]/button'),
      loginConfirmElement: By.xpath('/html/body/div/main/div/div[1]/h1'),
      dashboardElement: By.xpath('/html/body/div/main/div/div[1]/h1')
    }
  },
  blockmesh: {
    loginUrl: "chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp/js/popup.html",
    extensionUrl: "chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp/js/popup.html",
    checkUrl: "https://app.blockmesh.xyz/ui/dashboard",
    selectors: {
      usernameInput: By.xpath('//*[@id="mount_to"]/div[2]/div[2]/form/div[1]/input'),
      passwordInput: By.xpath('//*[@id="mount_to"]/div[2]/div[2]/form/div[2]/input'),
      loginButton: By.xpath('//*[@id="mount_to"]/div[2]/div[2]/form/button'),
      dashboardButton: By.xpath('//*[@id="mount_to"]/div[2]/div[3]/button[1]/a'),
      emailDashboardInput: By.xpath('//*[@id="email"]'),
      passwordDashboardInput: By.xpath('//*[@id="password"]'),
      loginDashboardButton: By.xpath('//*[@id="content"]/form/div/div/div[4]/button'),
      pointValue: By.xpath('/html/body/div[2]/main/div/div/div[4]/div[5]/div/div[2]/div/span')
    }
  },
  despeed: {
    loginUrl: "https://app.despeed.net/login",
    extensionUrl: "chrome-extension://ofpfdpleloialedjbfpocglfggbdpiem/popup.html",
    selectors: {
      usernameInput: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[1]/div/input'),
      passwordInput: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[2]/div/input'),
      hcapchaIframe: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[4]/div/iframe'),
      hcapchaCheckbox: By.css('div#checkbox[role="checkbox"]'),
      hcapchaChecked: By.xpath('//iframe[contains(@data-hcaptcha-response, "ey")]'),
      loginButton: By.xpath('//*[@id="root"]/section/div/div/div/div[2]/form/div[5]/button'),
      loginConfirmElement: By.xpath('//*[@id="app-container"]/div/div[4]/div/div[1]/div[2]'),
      loginConfirmDashboard: By.xpath('//*[@id="root"]/div[1]/div/div/div[1]/div[2]/div/div/div/main/div/div[1]/div/div[1]/div/div[1]/h3'),
      pointValue: By.xpath('//*[@id="app-container"]/div/div[4]/div/div[1]/div[2]/h3'),
    }
  },
  depined: {
    loginUrl: "https://app.depined.org/onboarding",
    extensionUrl: "chrome-extension://pjlappmodaidbdjhmhifbnnmmkkicjoc/popup.html",
    selectors: {
      usernameInput: By.xpath('//*[@id="email"]'),
      passwordInput: By.xpath('//*[@id="password"]'),
      loginButton: By.xpath('//*[@id="modal"]/div/div[2]/div/div[3]/div[1]/div[1]/div/div[2]/div/div[3]/div[4]/div/div'),
      connectButton: By.xpath('//*[@id="connect-button"]'),
      loginConfirmElement: By.xpath('//*[@id="connect-button"]/span[normalize-space(text()) = "Connected"]'),
      loginConfirmDashboard: By.xpath('//*[@id="root"]/div[3]/div[3]/div[1]/div[4]/div[1]/div[1]'),
      pointValue: By.xpath('//*[@id="container"]/div[3]/div[1]/div[2]/span'),
    }
  },
  voltix: {
    // The Voltix extension URL that initiates the connection flow.
    loginUrl: "chrome-extension://dhffhdepkkepbcienheompkncklalogf/index.html",
    // Typically the same as loginUrl, used to navigate or refresh the extension.
    extensionUrl: "chrome-extension://dhffhdepkkepbcienheompkncklalogf/index.html",
    selectors: {
      // Button on the Voltix extension to initiate wallet connection.
      connectWalletButton: "//button[contains(text(),'Connect wallet')]",
      // Button on the Voltix dashboard for wallet connection.
      connectWalletDashboardButton: "/html/body/main/aside[2]/div[1]/div/button",
      // Next step button after wallet connection on the dashboard.
      nextButton: "//*[@id='radix-:r0:']/div[2]/div[1]/button",
      // Phantom wallet popup: input field for unlocking with the password.
      phantomUnlockInput: "//*[@id='unlock-form']/div[2]/div/input",
      // Phantom wallet popup: button to unlock the wallet.
      phantomUnlockButton: "//*[@id='root']/div/div[1]/div/div[2]/div/button",
      // Phantom wallet popup: button to connect the wallet.
      phantomConnectButton: "//*[@id='root']/div/div[1]/div/div[2]/div/button[2]",
      // Phantom wallet confirmation popup: button to confirm the connection.
      phantomConfirmButton: "//*[@id='root']/div/div[1]/div/div[2]/div/button[2]",
      // Voltix extension: button to start mining.
      startMiningButton: "//*[@id='root']/div[1]/div/div/div[2]/div[2]/button",
      // Indicator element (e.g., Stop training button) showing the mining has started.
      stopTrainingButton: "//button[contains(text(),'Stop training')]",
      pointValue: "//*[@id='root']/div[1]/div/div/div[2]/div[1]/div[2]/div[1]"
    }
  },
  hcapcha: {
    accessSignupUrl: "https://www.hcaptcha.com/accessibility",
    setCookieUrl: "",
    h_selectors: {
      emailInput: By.xpath('//*[@id="email"]'),
      congratsText: By.xpath('//*[@id="root"]/div/div[1]/div/div[2]/p[1]'),
      setCookieButton: By.xpath('//*[@id="root"]/div[2]/div/div/div[3]/button'),
      setCookieConfirm: By.xpath('//*[@id="root"]/div[2]/div/div/div[3]/span'),
    }
  },
  hcapchaSolver: {
    extensionUrl: "chrome-extension://hlifkpholllijblknnmbfagnkjneagid/popup/popup.html",
    selectors: {
      capchaSolved: By.xpath('//*[@id="anchor-state"]/div[3]/img'),
    }
  },
  veer: {
    loginUrl: "https://mail.veer.vn",
    selectors: {
      emailInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[1]/input'),
      passwordInput: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[2]/input'),
      loginButton: By.xpath('//*[@id="app"]/div/div[1]/div[2]/div/div[2]/div/div[2]/form/div[3]/button'),
      loginConfirmElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
      inboxElement: By.xpath('//*[@id="mail-box-toggle"]/div[3]'),
      firstMail: By.xpath('//*[@id="mail-item-0"]/div'),
      refreshButton: By.xpath('//*[@id="mail-box-toggle"]/div[3]/div/div/div[1]/div[1]/div[3]/a')
    }
  },
  bizflycloud: {
    loginUrl: 'https://id.bizflycloud.vn/login?service=https%3A%2F%2Fmail.bizflycloud.vn%2F&_t=webmail',
    selectors: {
      emailInput: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/div/input'),
      passwordInput: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/input'),
      nextButton: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div[1]/div/div/div/div/div[1]/form/div[1]/div/button'),
      loginButton: By.xpath('//*[@id="app"]/div/div/main/div/div/div/div/div/div/div/div/div[2]/form/div/div/div/div/button'),
      loginConfirmElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
      inboxElement: By.xpath('//*[@id="app"]/div/div/div[3]/div[1]/div[2]/div'),
      firstMail: By.xpath('//*[@id="threads_list"]/div[1]/div[3]/div[1]'),
      refreshButton: By.xpath('//*[@id="refresh-threads-btn"]')
    }
  },
  mtm: {
    loginUrl: 'chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#onboarding/welcome',
    selectors: {
      agreeCheckbox: By.xpath('//*[@id="onboarding__terms-checkbox"]'),
      createWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[2]/button'),
      importWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/ul/li[3]/button'),
      agreeCheckbox2: By.xpath('//*[@id="metametrics-opt-in"]'),
      iagreeButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
      passwordInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[1]/label/input'),
      passwordRepeatInput: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[2]/label/input'),
      iunderstandCheckbox: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/div[3]/label/span[1]/input'),
      createNewWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/form/button'),
      secureMyWalletButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button[2]'),
      revealMySecretButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/button'),
      nextButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[6]/div/button'),
      confirmButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[5]/button'),
      doneButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[3]/button'),
      nextButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
      doneButton2: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[2]/button'),
      mainetText: By.xpath('//*[@id="app-content"]/div/div[2]/div/div[1]/button/p'),
      confirmSecretInputButton: By.xpath('//*[@id="app-content"]/div/div[2]/div/div/div/div[4]/div/button')
    }
  }
};

// ─── TIMEOUTS CONFIGURATION ───────────────────────────────────────────────
const timeouts = {
  element: 60000,
  page: 60000,
  action: 10000,
  loginCheck: 10000,
};

// ─── AUTOMATION CONSTANTS ─────────────────────────────────────────────────
const MAX_LOGIN_RETRIES = 2;
const PROFILE_CLEANUP_ON_FAILURE = true;
const CHECK_INTERVAL = 360000;
const STAGGER_DELAY = 45000;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36";
const FAILED_TASKS_PATH = path.resolve('./output/fail_tasks.json');

// ─── EXTENSIONS CONFIGURATION ─────────────────────────────────────────────
const EXTENSIONS = {
  openloop: { path: path.resolve('./crxs/openloop.crx') },
  gradient: { path: path.resolve('./crxs/gradient.crx') },
  toggle: { path: path.resolve('./crxs/toggle.crx') },
  bless: { path: path.resolve('./crxs/bless.crx') },
  blockmesh: { path: path.resolve('./crxs/blockmesh.crx') },
  despeed: { path: path.resolve('./crxs/despeed.crx') },
  hcapchaSolver: { path: path.resolve('./crxs/hcapchasolver.crx') },
  depined: { path: path.resolve('./crxs/depined.crx') },
  phantom: { path: path.resolve('./crxs/phantom.crx') },
  voltix: { path: path.resolve('./crxs/voltix.crx') },
};

// ─── CHROME OPTIONS SETUP ───────────────────────────────────────────────
const configureChromeOptions = () => {
  const options = new chrome.Options();
  const args = [
    `--user-agent=${USER_AGENT}`,
    // '--disable-web-security',
    // '--ignore-certificate-errors',
    // '--dns-prefetch-disable',
    // '--enable-unsafe-swiftshader',
    // '--no-first-run',
    // '--enable-automation', 
    // '--allow-remote-origin',
    '--allow-pre-commit-input',
    'start-maximized',
    'disable-infobars',
    '--disable-application-cache',
    // WebRTC-related flags
    // '--disable-webrtc',
    // '--disable-features=WebRtcHideLocalIpsWithMdns',
    // '--force-webrtc-ip-handling-policy=public_interface_only',
    // Reduce logging verbosity
    '--log-level=3',
    // '--vmodule=*/webrtc/*=0,*/libjingle/*=0',
    // Run headless
    // '--headless'
  ];

  if (os.platform() === 'linux') {
    args.push('--headless', '--no-sandbox', '--disable-gpu');
    options.setChromeBinaryPath('/usr/bin/chromium-browser');
  }

  options.addArguments(args);
  return options;
};

// ─── LOG4JS CONFIGURATION ─────────────────────────────────────────────────
log4js.configure({
    appenders: {
      file: { type: 'file', filename: 'automation.log' },
      console: { type: 'console' }
    },
    categories: {
      default: { appenders: ['console', 'file'], level: 'info' }
    }
  });
  

const logger = log4js.getLogger();

module.exports = {
  services,
  timeouts,
  MAX_LOGIN_RETRIES,
  PROFILE_CLEANUP_ON_FAILURE,
  CHECK_INTERVAL,
  STAGGER_DELAY,
  USER_AGENT,
  FAILED_TASKS_PATH,
  EXTENSIONS,
  configureChromeOptions,
  logger
};
