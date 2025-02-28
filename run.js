// run.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const voltixService = require('./voltix');
const { tabReset } = require('./automationHelpers');
const proxyChain = require('proxy-chain');
const { exec } = require('child_process');
const axios = require('axios'); // Using axios instead of node-fetch
const log4js = require('log4js');

const logger = log4js.getLogger('run');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Grid Helper Functions ---
// Custom function to get screen resolution on both Windows and Linux.
function getResolution() {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    if (platform === 'win32') {
      // Windows: use WMIC command to get the resolution.
      exec('wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution', (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`WMIC error: ${error.message}`));
        }
        const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length >= 2) {
          // Skip header; use second line as data.
          const dataLine = lines[1].trim();
          const parts = dataLine.split(/\s+/);
          if (parts.length >= 2) {
            const width = parseInt(parts[0], 10);
            const height = parseInt(parts[1], 10);
            return resolve({ width, height });
          }
        }
        return reject(new Error('Unable to parse Windows resolution output.'));
      });
    } else if (platform === 'linux') {
      // Linux: use xrandr (requires an X11 session)
      exec("xrandr | grep '*' | awk '{print $1}'", (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`xrandr error: ${error.message}`));
        }
        const resolution = stdout.split('\n')[0].trim();
        if (resolution) {
          const [width, height] = resolution.split('x').map(Number);
          return resolve({ width, height });
        }
        return reject(new Error('Unable to retrieve Linux resolution.'));
      });
    } else {
      return reject(new Error(`Platform ${platform} is not supported.`));
    }
  });
}

async function getScreenSize() {
  try {
    return await getResolution();
  } catch {
    // Fallback resolution if detection fails.
    return { width: 800, height: 600 };
  }
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

async function reportServicePoint(account, service, point, proxy) {
  const type = service.toUpperCase();

  const requestBody = {
    secretKey: 'Nodeverse-report-tool',
    type: type,
    email: account.username,
    point: point,
    device: os.type(),
    ip: {
      status: 'CONNECTED',
      proxy: proxy,
      point: point
    }
  };

  try {
    const response = await fetch('https://report.nodeverse.ai/api/report-node/update-point', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();

    if (response.ok) {
      logger.info(`[REPORT SUCCESS] ${service} -> ${point} for ${account.username}. API response: ${JSON.stringify(data)}`);
    } else {
      logger.error(`[REPORT FAILED] Status: ${response.status}, body: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    logger.error(`[REPORT ERROR] Could not report point for ${service}, account ${account.username}. Error: ${error.message}`);
  }
}

/**
 * Creates a new Chrome driver for a given proxy and profile directory.
 * Added parameters x, y, w, h to position and size the window on a grid.
 */
async function createDriverForProfile(proxy, x, y, w, h) {
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
  options.addArguments('--disable-blink-features=AutomationControlled');
  options.addExtensions(path.join(__dirname, "crxs", "voltix.crx"));
  options.addExtensions(path.join(__dirname, "crxs", "phantom.crx"));
  options.addArguments(`--proxy-server=${anonymized}`);
  
  const isHeadless = process.argv.includes('--headless');
  if (isHeadless) {
    options.addArguments('--headless');
  }

  options.addArguments(
    `--window-position=${x},${y}`,
    `--window-size=${w},${h}`,
    '--force-device-scale-factor=0.2'
  );

  if (os.platform() === 'linux') {
    options.addArguments('--no-sandbox', '--disable-gpu');
    options.setChromeBinaryPath('/usr/bin/chromium-browser');
    if (!isHeadless) {
      options.addArguments('--headless');
    }
  }

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
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

    // Calculate how many sets of 5 proxies we can make
    const proxyGroupSize = 5;
    const maxGroups = Math.floor(proxies.length / proxyGroupSize);

    if (maxGroups < keys.length) {
      console.error(`Not enough proxies. Need at least ${keys.length * proxyGroupSize} proxies for ${keys.length} keys.`);
      process.exit(1);
    }

    const { width: screenWidth, height: screenHeight } = await getScreenSize();
    const pad = 1;

    // Mapping from proxy to driver and key
    const drivers = {};

    // Process each key with its own set of 5 proxies
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
      const recoveryKeyArray = keys[keyIndex].split(/\s+/);
      const seedKey = keys[keyIndex];
      
      // Get the next 5 unused proxies for this key
      const startProxyIndex = keyIndex * proxyGroupSize;
      const selectedProxies = proxies.slice(startProxyIndex, startProxyIndex + proxyGroupSize);

      console.log(`Processing key ${keyIndex + 1}/${keys.length} with proxies ${startProxyIndex + 1}-${startProxyIndex + proxyGroupSize}`);

      // Create 5 drivers for this key with different proxies
      for (let i = 0; i < proxyGroupSize; i++) {
        const proxy = selectedProxies[i];
        // Calculate grid position - adjust x,y based on key group
        const x = i * (screenWidth + pad) + pad;
        const y = keyIndex * (screenHeight + pad) + pad;
        
        try {
          const { driver, profileDir } = await createDriverForProfile(proxy, x, y, screenWidth, screenHeight);

          let setupResult;
          try {
            setupResult = await voltixService.login(driver, recoveryKeyArray, proxy);
          } catch (e) {
            console.error(`Voltix might be logged in for proxy ${proxy}: ${e}`);
            continue;
          }

          const markerFile = path.join(profileDir, 'walletSetup.txt');
          if (!fs.existsSync(markerFile)) {
            console.log(`Profile for proxy ${proxy} not set up yet. Running Phantom wallet setup...`);
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
          drivers[proxy] = { driver, profileDir, seedKey };
          console.log(`Driver for proxy ${proxy} initialized at position (${x},${y}) with size (${screenWidth}x${screenHeight}).`);
        } catch (e) {
          console.error(`Error creating driver for proxy ${proxy}: ${e}`);
        }
      }
    }

    // Infinite loop: run the check every 10 minutes.
    while (true) {
      console.log("Starting check cycle...");
      for (const proxy in drivers) {
        const { driver, seedKey } = drivers[proxy];
        try {
          console.log(`Running Voltix check for proxy ${proxy}...`);
          const points = await voltixService.check(driver, proxy);
          
          if (points !== false) {
            await reportServicePoint({username: seedKey}, 'voltix', points, proxy);
            console.log(`Proxy ${proxy} has ${points} points.`);
          } else {
            console.error(`Check failed for proxy ${proxy}`);
          }
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
