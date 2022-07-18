import { Page } from "puppeteer";

// This regex is used to get the various text components inside a text fragment
const TEXT_CONTENT = "A-Za-z0-9%!#$'()*+/:;=?@[\\]-_.~"; // All allowed URL encoded characters EXCEPT & and ,
// text=[prefix-,]textStart[,textEnd][,-suffix]
export const TEXT_FRAGMENT_REGEX = new RegExp(
    `&?text=([${TEXT_CONTENT}]*\-)?,?([${TEXT_CONTENT}]*),?([${TEXT_CONTENT}]*)?,?(\-[${TEXT_CONTENT}]*)?`,
    'gi'
);

export const waitTillHTMLRendered = async (page: Page) => {
    const timeoutMs = 30000;
    const checkDurationMs = 1000;
    const maxChecks = timeoutMs / checkDurationMs;
    const minStableSizeIterations = 2;

    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;

    while (checkCounts++ <= maxChecks) {
        let html = await page.content();
        let currentHTMLSize = html.length;

        if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
            countStableSizeIterations++;
        else
            countStableSizeIterations = 0; //reset the counter

        if (countStableSizeIterations >= minStableSizeIterations)
            break;

        lastHTMLSize = currentHTMLSize;

        await page.waitForTimeout(checkDurationMs);
    }
};