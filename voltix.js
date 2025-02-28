// node_handler/voltix.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const { waitForElement, clickElement, waitForNewWindow, switchToWindowContainingUrl } = require('./automationHelpers');
const log4js = require('log4js');
const phantomService = require('./phantom');

class VoltixService {
  constructor() {
    this.logger = log4js.getLogger('VoltixService');
  }

  /**
   * Automates the Voltix login flow using the Phantom wallet.
   * (Login function code as previously defined.)
   */
  async login(driver, recoveryKeyArray, proxyUrl) {
    try {
      this.logger.info(`Starting Voltix login automation`);

      // Step 1: Setup Phantom Wallet using the provided recovery key.
      const phantomSetupResult = await phantomService.setupPhantomWallet(driver, recoveryKeyArray);
      if (!phantomSetupResult) {
        throw new Error("Phantom wallet setup failed");
      }

      // Step 2: Navigate to the Voltix extension.
      const { loginUrl, extensionUrl, selectors } = config.services.voltix;
      await driver.get(loginUrl);
      await driver.sleep(3000);

      // Click the "Connect wallet" button.
      let originalHandles = await driver.getAllWindowHandles();
      await clickElement(driver, selectors.connectWalletButton);
      await driver.sleep(2000);

      // Step 3: Handle Voltix Dashboard.
      let voltixLoginHandle = await waitForNewWindow(driver, originalHandles, 10000);
      if (!voltixLoginHandle) {
        throw new Error("Voltix login tab did not open");
      }
      await driver.switchTo().window(voltixLoginHandle);
      await driver.wait(until.urlContains("voltix.ai/dashboard?action=login"), 10000);

      originalHandles = await driver.getAllWindowHandles();

      // On the Voltix dashboard, click the "connect wallet" button.
      await clickElement(driver, selectors.connectWalletDashboardButton);
      await driver.sleep(2000);

      // Then click the next button.
      await clickElement(driver, selectors.nextButton);
      await driver.sleep(2000);

      // Step 4: Handle the Phantom popup for wallet unlock and connection.
      let phantomPopupHandle = await waitForNewWindow(driver, originalHandles, 10000);
      if (!phantomPopupHandle) {
        throw new Error("Phantom popup did not appear");
      }
      
      await driver.switchTo().window(phantomPopupHandle);
      
      await clickElement(driver, selectors.phantomConnectButton);
      await driver.sleep(2000);

      // Step 5: Handle Phantom confirmation popup.
      await switchToWindowContainingUrl(driver, 'bfnaelmomeimhlpmgjnjophhpkkoljpa', 10000);
      await driver.sleep(1000);
      await clickElement(driver, selectors.phantomConfirmButton);
      await driver.sleep(2000);

      // Wait for phantom popup to disappear
      let currentHandles = await driver.getAllWindowHandles();
      let phantomHandleGone = false;
      for (let i = 0; i < 10; i++) {
        currentHandles = await driver.getAllWindowHandles();
        if (!currentHandles.some(handle => handle.includes('bfnaelmomeimhlpmgjnjophhpkkoljpa'))) {
          phantomHandleGone = true;
          break;
        }
        await driver.sleep(1000);
      }

      if (!phantomHandleGone) {
        throw new Error("Phantom confirmation popup did not close");
      }

      await driver.sleep(10000);

      // Close all tabs except the first one
      const handles = await driver.getAllWindowHandles();
      for (let i = 1; i < handles.length; i++) {
        await driver.switchTo().window(handles[i]);
        await driver.close();
      }
      await driver.switchTo().window(handles[0]);
      
      // Navigate directly to Voltix extension
      await driver.get(config.services.voltix.extensionUrl);
      await driver.sleep(2000);

      // Chose mining option
      await clickElement(driver, By.xpath(`//*[@id="root"]/div[1]/div/div/div[2]/div[2]/div[1]/button`));
      await driver.sleep(1000);
      await clickElement(driver, By.xpath(`//*[@id="root"]/div[1]/div/div/div[2]/div[2]/div[2]`));
      await driver.sleep(1000);
      await clickElement(driver, By.xpath(`//*[@id="root"]/div[1]/div/div/div[2]/button`));
      await driver.sleep(1000);

      const startButton = await driver.findElement(selectors.startMiningButton);
      const buttonText = await startButton.getText();
      if (buttonText === 'Start training') {
        await clickElement(driver, selectors.startMiningButton);
      }

      this.logger.info(`Voltix login automation success for proxy ${proxyUrl}`);
      return true;
    } catch (error) {
      this.logger.error(`Voltix login failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Checks the Voltix extension for the current point value.
   * @param {WebDriver} driver - Selenium WebDriver instance.
   * @param {string} username - Account username.
   * @param {string} proxyUrl - Proxy URL info (for logging/debugging).
   * @returns {Promise<number|boolean>} - Returns the point value or false if failed.
   */
  async check(driver, username) {
    try {
      // Navigate to the Voltix extension page.
      await driver.get(config.services.voltix.extensionUrl);
      await driver.sleep(2000);

      const { selectors } = config.services.voltix;

      const startButton = await driver.findElement(selectors.startMiningButton);
      const buttonText = await startButton.getText();
      if (buttonText === 'Start training') {
        await clickElement(driver, selectors.startMiningButton);
      }
      // Wait for the element that displays the point value.
      const pointElement = await waitForElement(driver, selectors.pointValue, 20000);
      const pointText = await pointElement.getText();
      this.logger.info(`Voltix points for ${username}: ${pointText}`);

      const point = parseInt(pointText, 10);
      return isNaN(point) ? 0 : point;
    } catch (error) {
      this.logger.error(`Voltix check failed for ${username}: ${error.message}`);
      return false;
    }
  }
}

module.exports = new VoltixService();
