// node_handler/phantom.js
const { By } = require('selenium-webdriver');
const { clickElement, enterText, waitForElement } = require('./automationHelpers');
const log4js = require('log4js');

class PhantomService {
  constructor() {
    this.logger = log4js.getLogger('PhantomService');
  }

  /**
   * Sets up the Phantom wallet by importing a wallet via a 12-word recovery phrase.
   * @param {WebDriver} driver - Selenium WebDriver instance.
   * @param {Array<string>} seedPhrases - Array of 12 seed words.
   * @returns {Promise<boolean>} - Returns true if setup completes successfully.
   */
  async setupPhantomWallet(driver, seedPhrases) {
    try {
      this.logger.info('Starting Phantom wallet setup');

      // Navigate to Phantom wallet onboarding URL.
      const loginUrl = 'chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/onboarding.html';
      await driver.get(loginUrl);
      await driver.sleep(3000); // Allow time for the page to load

      // Click "I have a wallet"
      await clickElement(driver, By.xpath('//*[@id="root"]/main/div[2]/div/div[2]/button[2]'));
      await driver.sleep(1000);

      // Click "Import Recovery Phrases"
      await clickElement(driver, By.xpath('//*[@id="root"]/main/div[2]/div/div[2]/button[2]/div[2]/div/div'));
      await driver.sleep(1000);

      // Fill in the 12 seed phrase inputs
      for (let i = 0; i < 12; i++) {
        const inputSelector = By.css(`input[data-testid="secret-recovery-phrase-word-input-${i}"]`);
        await waitForElement(driver, inputSelector);
        await clickElement(driver, inputSelector);
        await enterText(driver, inputSelector, seedPhrases[i]);
      }

      // Click "Import Wallet"
      await clickElement(driver, By.xpath('//*[@id="root"]/main/div[2]/form/button'));
      
      // Wait for confirmation element that indicates account detection ("We found")
      await waitForElement(driver, By.xpath('//p[contains(text(), "We found")]'));
      
      // Click the "Continue" button to proceed
      await clickElement(driver, By.xpath('//*[@id="root"]/main/div[2]/form/button[2]'));
      await driver.sleep(1000);

      // Fill in the password fields with the default password "Rtn@2024"
      const passwordInputSelector = By.css('input[data-testid="onboarding-form-password-input"]');
      const confirmPasswordSelector = By.css('input[data-testid="onboarding-form-confirm-password-input"]');
      await waitForElement(driver, passwordInputSelector);
      await enterText(driver, passwordInputSelector, "Rtn@2024");
      await waitForElement(driver, confirmPasswordSelector);
      await enterText(driver, confirmPasswordSelector, "Rtn@2024");
      await driver.sleep(1000);
      // Click the Terms of Service checkbox
      await clickElement(driver, By.css('[data-testid="onboarding-form-terms-of-service-checkbox"]'));

      // Click the submit ("Continue") button to complete the import process
      await clickElement(driver, By.css('[data-testid="onboarding-form-submit-button"]'));
      
      // Wait until the final success message ("You're all done!") appears
      await waitForElement(driver, By.xpath('//p[contains(text(), "You\'re all done!")]'));

      this.logger.info('Phantom wallet setup completed successfully.');
      return true;
    } catch (error) {
      this.logger.error(`Phantom wallet setup failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = new PhantomService();
