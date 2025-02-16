// node_handler/automationHelpers.js
const { By, until } = require('selenium-webdriver');
const config = require('./config');
const fs = require('fs');
const {
  logger
} = require('./config');


async function waitForElement(driver, selector, timeout = config.timeouts.element) {
  try {
    return await driver.wait(until.elementLocated(selector), timeout);
  } catch (error) {
    throw new Error(`Element not found: ${selector} - ${error.message}`);
  }
}

async function checkElementExsist(driver, selector, timeout = config.timeouts.element) {
  try {
    await driver.wait(until.elementLocated(selector), timeout);
    return true;
  } catch (error) {
    return false;
  }
}

async function clickElement(driver, selector) {
  const element = await waitForElement(driver, selector);
  await element.click();
}

async function safeClick(driver, selector, timeout = 2000) {
  try {
    const element = await driver.wait(until.elementLocated(selector), timeout);
    await element.click();
    return true;
  } catch (error) {
    return false;
  }
}

async function enterText(driver, selector, text) {
  const element = await waitForElement(driver, selector, 10000);
  // await element.clear();
  await element.sendKeys(text);
}


async function tabReset(driver) {
    // Tab cleanup logic.
    try {
      const handles = await driver.getAllWindowHandles();
      if (handles.length > 1) {
        for (let i = handles.length - 1; i > 0; i--) {
          await driver.switchTo().window(handles[i]);
          await driver.close();
        }
        await driver.switchTo().window(handles[0]);
      }
      await driver.get('about:blank');
    } catch (error) {
      console.log(`[TAB CLEANUP ERROR] ${error.message}`);
    }
}

async function scrollToElement(driver, selector) {
  const element = await waitForElement(driver, selector);
  await driver.executeScript("arguments[0].scrollIntoView(true);", element);
}

async function waitForElementToBeClickable(driver, selector, timeout = config.timeouts.element) {
  try {
    const element = await driver.wait(until.elementLocated(selector), timeout);
    await driver.wait(until.elementIsVisible(element), timeout);
    await driver.wait(until.elementIsEnabled(element), timeout);
    return element;
  } catch (error) {
    throw new Error(`Element not clickable: ${selector} - ${error.message}`);
  }
}

async function waitForElementToBeInvisible(driver, selector, timeout = config.timeouts.element) {
  try {
    await driver.wait(until.elementLocated(selector), timeout);
    return await driver.wait(until.elementIsNotVisible(driver.findElement(selector)), timeout);
  } catch (error) {
    throw new Error(`Element did not become invisible: ${selector} - ${error.message}`);
  }
}

async function getElementText(driver, selector) {
  const element = await waitForElement(driver, selector);
  return await element.getText();
}

async function selectDropdownByValue(driver, selector, value) {
  const element = await waitForElement(driver, selector);
  const options = await element.findElements(By.tagName('option'));
  for (let option of options) {
    const optionValue = await option.getAttribute('value');
    if (optionValue === value) {
      await option.click();
      break;
    }
  }
}

async function switchToNewWindow(driver) {
  const originalWindow = await driver.getWindowHandle();
  const windows = await driver.getAllWindowHandles();
  for (let handle of windows) {
    if (handle !== originalWindow) {
      await driver.switchTo().window(handle);
      return;
    }
  }
  throw new Error('No new window found');
}

async function closeAllOtherTabs(driver) {
  const currentHandle = await driver.getWindowHandle();
  const handles = await driver.getAllWindowHandles();
  for (let handle of handles) {
    if (handle !== currentHandle) {
      await driver.switchTo().window(handle);
      await driver.close();
    }
  }
  await driver.switchTo().window(currentHandle);
}

async function takeScreenshot(driver, filepath) {
  const image = await driver.takeScreenshot();
  fs.writeFileSync(filepath, image, 'base64');
}

async function clearAndEnterText(driver, selector, text) {
  const element = await waitForElement(driver, selector);
  await element.clear();
  await element.sendKeys(text);
}

async function waitForUrlToContain(driver, substring, timeout = config.timeouts.page) {
  try {
    await driver.wait(until.urlContains(substring), timeout);
  } catch (error) {
    throw new Error(`URL did not contain "${substring}" within ${timeout} ms - ${error.message}`);
  }
}

async function getAttribute(driver, selector, attribute, timeout = config.timeouts.page) {
  const element = await waitForElement(driver, selector, timeout);
  return await element.getAttribute(attribute);
}

async function switchToIframe(driver, selector, timeout = config.timeouts.element) {
  try {
    const iframe = await waitForElement(driver, selector, timeout);
    await driver.switchTo().frame(iframe);
  } catch (error) {
    throw new Error(`Failed to switch to iframe: ${selector} - ${error.message}`);
  }
}

/**
 * Utility function to switch to a window containing a specific URL substring.
 * @param {WebDriver} driver
 * @param {string} urlPart - The substring to search for in the URL.
 * @param {number} timeout - Timeout in milliseconds.
 * @returns {Promise<string|null>} - The window handle or null if not found.
 */
async function switchToWindowContainingUrl(driver, urlPart, timeout = 10000) {
  const start = Date.now();
  while ((Date.now() - start) < timeout) {
    let handles = await driver.getAllWindowHandles();
    for (let handle of handles) {
      await driver.switchTo().window(handle);
      let currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes(urlPart)) {
        return handle;
      }
    }
    await driver.sleep(500);
  }
  return null;
}


/**
 * Utility function to wait for a new window to open.
 * @param {WebDriver} driver
 * @param {Array<string>} currentHandles - Array of current window handles.
 * @param {number} timeout - Timeout in milliseconds.
 * @returns {Promise<string|null>} - The new window handle or null if not found.
 */
async function waitForNewWindow(driver, currentHandles, timeout = 10000) {
  let newHandle = null;
  const start = Date.now();
  while ((Date.now() - start) < timeout) {
    let handles = await driver.getAllWindowHandles();
    if (handles.length > currentHandles.length) {
      for (let handle of handles) {
        if (!currentHandles.includes(handle)) {
          newHandle = handle;
          break;
        }
      }
      if (newHandle) break;
    } 
    await driver.sleep(500);
  }
  return newHandle;
}


module.exports = {
  waitForElement,
  checkElementExsist,
  clickElement,
  safeClick,
  enterText,
  tabReset,
  scrollToElement,
  waitForElementToBeClickable,
  waitForElementToBeInvisible,
  getElementText,
  selectDropdownByValue,
  switchToNewWindow,
  closeAllOtherTabs,
  takeScreenshot,
  clearAndEnterText,
  waitForUrlToContain,
  getAttribute,
  switchToIframe,
  switchToWindowContainingUrl,
  waitForNewWindow
};
