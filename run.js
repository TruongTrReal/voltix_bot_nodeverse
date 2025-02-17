// runVoltixCheckLoop.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const voltixService = require('./voltix');
const { tabReset } = require('./automationHelpers');
const proxyChain = require('proxy-chain');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read file lines, filtering empty lines.
async function readFileLines(filePath) {
  const data = await fs.promises.readFile(filePath, 'utf8');
  return data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
}

// Sanitize a string to use as a folder name.
function sanitizeProxy(proxy) {
  return proxy.replace(/[:@]/g, '_');
}


/**
 * Creates a new Chrome driver for a given proxy and profile directory.
 * Returns an object containing both the driver and its profile directory.
 */
async function createDriverForProfile(proxy) {
  const profilesDir = path.join(__dirname, 'profiles');
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir);
  }
  const profileDir = path.join(profilesDir, sanitizeProxy(proxy));
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }
  const anonymized = await proxyChain.anonymizeProxy(`http://${proxy}`);
  const options = new chrome.Options();
  options.addArguments('start-maximized');
  options.addArguments('--disable-blink-features=AutomationControlled');
  // Load Voltix and Phantom extensions.
  options.addExtensions(path.join(__dirname, ".", "crxs", "voltix.crx"));
  options.addExtensions(path.join(__dirname, ".", "crxs", "phantom.crx"));
  options.addArguments(`--proxy-server=${anonymized}`);
  options.addArguments(`--user-data-dir=${profileDir}`);

  if (os.platform() === 'linux') {
    options.addArguments('--headless', '--no-sandbox', '--disable-gpu');
    options.setChromeBinaryPath('/usr/bin/chromium-browser');
  }

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  // Allow time for extensions to load.
  await sleep(10000);
  await tabReset(driver);
  return { driver, profileDir };
}


async function main() {
  try {
    const keysFile = path.join(__dirname, 'phantomKeys.txt');
    const proxyFile = path.join(__dirname, 'proxy.txt');
    const keys = await readFileLines(keysFile);
    const proxies = await readFileLines(proxyFile);

    if (keys.length > proxies.length) {
      console.error("Not enough proxies for each key.");
      process.exit(1);
    }

    // Mapping from proxy to driver and recoveryKey.
    const drivers = {}; // { [proxy]: { driver, recoveryKeyArray, profileDir } }

    // For each key/proxy pair, create a driver.
    for (let i = 0; i < keys.length; i++) {
      const keyLine = keys[i];
      const proxy = proxies[i];
      // Each key line is assumed to be a space-separated 12-word recovery phrase.
      const recoveryKeyArray = keyLine.split(/\s+/);
      try {
        const { driver, profileDir } = await createDriverForProfile(proxy);

        // Check for a marker file to decide if Phantom wallet needs to be set up.
        const markerFile = path.join(profileDir, 'walletSetup.txt');
        if (!fs.existsSync(markerFile)) {
          console.log(`Profile for proxy ${proxy} not set up yet. Running Phantom wallet setup...`);
          const setupResult = await voltixService.login(driver, recoveryKeyArray, proxy);
          if (setupResult) {
            console.log(`Profile for proxy ${proxy} set up successfully.`);
            fs.writeFileSync(markerFile, "setup complete", "utf8");
          } else {
            console.error(`Phantom wallet setup failed for proxy ${proxy}. Closing driver.`);
            await driver.quit();
            continue;
          }
        } else {
          console.log(`Profile for proxy ${proxy} already set up.`);
        }
        drivers[proxy] = { driver, recoveryKeyArray, profileDir };
        console.log(`Driver for proxy ${proxy} initialized.`);
      } catch (e) {
        console.error(`Error creating driver for proxy ${proxy}: ${e}`);
      }
    }

    // Infinite loop: run the check every 10 minutes.
    while (true) {
      console.log("Starting check cycle...");
      for (const proxy in drivers) {
        const { driver } = drivers[proxy];
        try {
          console.log(`Running Voltix check for proxy ${proxy}...`);
          const points = await voltixService.check(driver, proxy, proxy);
          console.log(`Proxy ${proxy} has ${points} points.`);
        } catch (e) {
          console.error(`Error during check for proxy ${proxy}: ${e}`);
          try {
            await driver.quit();
          } catch (err) {
            console.error(`Error closing driver for proxy ${proxy}: ${err}`);
          }
          delete drivers[proxy];
        }
      }
      console.log("Check cycle complete. Sleeping for 10 minutes...");
      await sleep(10 * 60 * 1000);
    }
  } catch (error) {
    console.error("Error in main loop:", error);
  }
}

main();
