const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
import config from './config';

export async function audit(url: string) {
    const browser = await puppeteer.launch({
        args: [`--remote-debugging-port=${ config.port }`],
        headless: false,
        executablePath: config.browserPath,
        defaultViewport: {
            width: 1280,
            height: 800
        }
    });
    
    const page = await browser.newPage();
    page.setCookie(
        {
            name: 'ga-app-version',
            value: 'green',
            url: url,
            domain: '.royalcaribbean.com'
        }
    );

    // Login
    await page.goto(url, { timeout: 15000 });
    await page.waitForNavigation();

    await page.waitForSelector('#mat-input-0');
    await page.waitForSelector('#mat-input-1');
    const user = await page.$('#mat-input-0');
    const pwd = await page.$('#mat-input-1');

    await user.type( config.username );
    await pwd.type( config.password );

    await pwd.press('Enter');

    // Dashboard
    await page.waitForSelector('.reservation-card__content-number');
    await page.keyboard.down('ShiftLeft');
    await page.keyboard.down('AltLeft');
    const cpbutton = await page.$$('#cruisePlannerButton');
    cpbutton[1].click();

    // Navigate to PMC Home
    await page.waitForNavigation();
    const pageUrl = page.url();
    await page.close();

    const opts =  {
        port: config.port,
        disableStorageReset: true
    };
    
    // see https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/constants.js
    const lighthouseConfig = {
        extends: 'lighthouse:default',
        settings: {
            // throttling: throttling.mobileSlow4G, 
            emulatedFormFactor: 'desktop' // can ve mobile, table, desktop
        }
    };
    const result = await lighthouse(pageUrl, opts, lighthouseConfig);
    await browser.close();
    return {
        js: result.lhr,
        json: result.report
    };
};