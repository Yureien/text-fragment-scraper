require('mocha');
import chai = require('chai');

import {
    extractTextFragments,
    scrapeURL,
} from './scraper';

const expect = chai.expect;

describe('Text fragment scraper library', function () {

    it('should be able to extract text fragments', function () {
        const tests = {
            "https://oleb.net/2020/text-fragments/#:~:text=Text%20fragments%20are%20a%20way,(released%20in%20February%202020).": [
                {
                    textStart: 'Text fragments are a way',
                    textEnd: '(released in February 2020).',
                    prefix: '',
                    suffix: ''
                }
            ],
            "https://blog.chromium.org/2019/12/chrome-80-content-indexing-es-modules.html#:~:text=Text%20URL%20Fragments&text=text,-parameter": [
                {
                    textStart: 'Text URL Fragments',
                    textEnd: '',
                    prefix: '',
                    suffix: ''
                },
                { textStart: 'text', textEnd: '', prefix: '', suffix: 'parameter' }
            ],
            "https://blog.chromium.org/2019/12/chrome-80-content-indexing-es-modules.html#HTML1:~:text=Give-,us,Product,-Forums.": [
                {
                    textStart: 'us',
                    textEnd: 'Product',
                    prefix: 'Give',
                    suffix: 'Forums.'
                }
            ],
        };
        Object.entries(tests).forEach(([url, result]) => {
            expect(
                extractTextFragments(url).map(fragments => ({
                    textStart: fragments.textStart,
                    textEnd: fragments.textEnd,
                    prefix: fragments.prefix,
                    suffix: fragments.suffix
                }))
            ).to.have.deep.members(result);
        });
    });

    it('should be able to scrape websites', async function () {
        this.timeout(15000);

        const tests = {
            "https://oleb.net/2020/text-fragments/#:~:text=Text%20fragments%20are%20a%20way,(released%20in%20February%202020).": [
                'Text fragments are a way for web links to specify a word or phrase a browser should highlight on the destination page. Google Chrome added support for them in version 80 (released in February 2020).'
            ],
            "https://blog.chromium.org/2019/12/chrome-80-content-indexing-es-modules.html#:~:text=Text%20URL%20Fragments&text=text,-parameter": [
                'Text URL Fragments',
                'text'
            ],
            "https://blog.chromium.org/2019/12/chrome-80-content-indexing-es-modules.html#HTML1:~:text=Give-,us,Product,-Forums": [
                'us feedback in our Product'
            ],
            "https://blog.chromium.org/2019/12/chrome-80-content-indexing-es-modules.html#:~:text=ECMAScript%20Modules%20in%20Web%20Workers,ES%20Modules%20in%20Web%20Workers.": [
                'ECMAScript Modules in Web Workers\n' +
                'Web Workers have been available in most browsers for more than ten years. Consequently, the method for importing modules into a worker, importScripts(), has not been state of the art for some time. It blocks execution of the worker while it fetches and evaluates the imported script. It also executes scripts in the global scope, which can lead to name collisions and its associated problems.\n' +
                '\n' +
                'Enter Module Workers. The Worker constructor now supports a type option with the value "module", which changes script loading and execution to match <script type="module">. \n' +
                '\n' +
                '\n' +
                "const worker = new Worker('worker.js', {\n" +
                "  type: 'module'\n" +
                '});\n' +
                '\n' +
                'Module Workers support standard JavaScript imports and dynamic import for lazy-loading without blocking worker execution. For background and details see ES Modules in Web Workers.'
            ],
        };

        for (const [url, result] of Object.entries(tests)) {
            const data = await scrapeURL(url);
            expect(data).to.have.members(result);
        }
    });

});