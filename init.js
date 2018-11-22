require('dotenv').config();
const products = require('./products.json');
const functions = require("./functions.js");
const sleepTime = process.env.SLEEP_TIME;
const maxTimeouts = process.env.MAX_TIMEOUTS;
const sleep = require('util').promisify(setTimeout);

const init = async () => {
    console.log('init\n');
    let maxTimeoutsCounter = 0;

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const visited = await functions.visitProduct(product);

        if(!visited){
            maxTimeoutsCounter++;
        }

        if(maxTimeoutsCounter > maxTimeouts){
            console.log('timeouts counter exceeded. Sleeping...');
            break;
        }
    }

    console.log('done \n\n');
    await sleep(sleepTime);
    init();
};

init();

