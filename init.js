require('dotenv').config();

const sleep = require('util').promisify(setTimeout);
const functions = require("./functions.js");

const products = require(`./lists/${process.env.LIST}.json`);
const sleepTime = process.env.SLEEP_TIME;
const maxTimeouts = process.env.MAX_TIMEOUTS;

if (!products || ! products.length) {
    throw new Error(`Invalid list provided: ${process.env.LIST}`)
}

let cicle = 0;

const init = async () => {
    console.log(`${new Date()} init`, "\n");
    console.time('cicle time');

    let maxTimeoutsCounter = 0;

    let ellapsed = 0;
    let total = 0;

    for (let i = 0; i < products.length; i++) {
    // for (let i = 0; i < 1; i++) {
        try {
            const product = products[i];
            const prefix = [
                `[${("00000" + cicle).slice(cicle.length*-1)}]`,
                `[${("00000" + i).slice(i.length*-1)}]`
            ].join('')

            console.time(`${prefix} ${product}`);
            console.log(`${prefix} ${product}: starting`)

            const result = await functions.visitProduct(product, prefix);

            console.timeEnd(`${prefix} ${product}`);

            console.log(`${prefix} ${product}: ${result.status}`);

            logResult(result, prefix);

            total++;

            if (result.status == 'OK') {
                maxTimeoutsCounter = 0;
                continue;
            }

            maxTimeoutsCounter++;

            if(maxTimeoutsCounter > maxTimeouts){
                console.log('timeouts counter exceeded. Sleeping...');
                cicle++;
                break;
            }
        } catch (error) {
            console.log(error);
            console.log(`ignoring ${product} due error listed above`);
            continue;
        }
    }

    console.log("\n\n");

    console.log(`${new Date()} done`, "\n");
    console.log(`cicle count: ${cicle}`);
    console.timeEnd("cicle time");
    console.log(`total records: ${total}`);

    console.log("\n\n");

    await sleep(sleepTime);
    init();
};

function logResult(result) {
    let log = [];

    if (result.status != 'OK') {
        log.push(`\n`);
        log.push(`${product} `);
        log.push(`${result.product} `);
        log.push(`[${result.status}]`);
        log.push(`[${result.response_status}]`);

        if (result.response_message)
            log.push(result.response_message);

        log.push(`\n`);

        console.log(log.join(''));
    }
}

init();
