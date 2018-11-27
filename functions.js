const puppeteer = require('puppeteer');
const timeoutLimit = process.env.TIMEOUT_LIMIT;

exports.visitProduct = (product, prefix) => {
    return new Promise(async (resolve, reject) => {
        let browser, page, resolved;

        try {
            browser = await puppeteer.launch();
            page = await browser.newPage();
            await page.setRequestInterception(true);
            await page.setDefaultNavigationTimeout(timeoutLimit);
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36');

            page.on('request', (request) => {
                // if already resolved, ignore the rest
                if (resolved) {
                    return request.abort();
                }

                // ignore heavy load requests
                if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                    return request.abort();
                }

                if (
                    /usebeon\.io.*event/i.test(request._url)
                    && /post/i.test(request._method)
                    && /"integra"/i.test(request._postData)
                ) {
                    console.log(`${prefix} ${product}: integra detected`)
                    if (! resolved) {
                        resolved = true;
                        setTimeout(() =>
                            resolve({
                                product,
                                response_status: 200,
                                status: 'OK'
                            }), 1000);
                    }
                }

                return request.continue();
            });


            response = await page.goto(`${product}`, {
                waitUntil: 'networkidle0'
            });

            if (response.status > 200 && ! resolved) {
                // console.log('response catch', response);
                resolved = true;
                return resolve({
                    product,
                    response_status: response.status,
                    status: 'ER'
                });
            }

        } catch (error) {
            console.log(error);
            return resolve({
                product,
                response_status: 500,
                response_message: error,
                status: 'ER'
            });

        } finally {
            await browser.close();

            if (! resolved) {
                resolved = true;
                return resolve({
                    product,
                    response_status: 0,
                    response_message: 'Browser closed, not sure if integra catched.',
                    status: 'ER'
                });
            }
        }
    });
};
