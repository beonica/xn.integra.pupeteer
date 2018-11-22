const puppeteer = require('puppeteer');
const timeoutLimit = process.env.TIMEOUT_LIMIT;

exports.visitProduct = async product => {
    const browser = await puppeteer.launch();

    try {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });

        page.setDefaultNavigationTimeout(timeoutLimit);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36');

        await page.exposeFunction('onCustomEvent', e => {
            // console.log(`${e.type} fired`, e || '');
        });

        function listenFor(type) {
            return page.evaluateOnNewDocument(type => {
                document.addEventListener(type, e => {
                    window.onCustomEvent({ type, detail: e.detail });
                });
            }, type);
        }

        await listenFor('beon.integra.done');
        const response = await page.goto(`${product}`);
        console.log(`url: ${product}, status: ${response._status}`);

        return true;
    } catch (error) {
        console.log(`url: ${product}, status: ${error}`);
        return false;
    }finally{
        await browser.close();
    }

};