import * as puppeteer from 'puppeteer';
import { TEXT_FRAGMENT_REGEX, waitTillHTMLRendered } from './utils';

/**
 * Text fragment parameters as defined in https://web.dev/text-fragments/#the-full-syntax
 */
export class TextFragment {
    prefix: string;
    suffix: string;
    textStart: string;
    textEnd: string;

    /**
     * If textEnd is missing, it will match the entire textStart string, otherwise
     * it will return all the data from textStart to textEnd excluding prefix and suffix.
     * @param textStart Starting words
     * @param textEnd Ending words (Optional)
     * @param prefix Prefix (Optional). Must end with '-'
     * @param suffix Suffix (Optional). Must start with '-'
     */
    constructor(textStart: string, textEnd?: string, prefix?: string, suffix?: string) {
        this.textStart = textStart;
        this.textEnd = textEnd ?? '';
        this.prefix = (prefix ?? '').slice(0, -1); // Remove trailing -
        this.suffix = (suffix ?? '').slice(1); // Remove initial -
    }

    /**
     * Extracts the complete text fragment from a given plaintext source
     * @param body Text content (usually document.body.textContent)
     * @returns Entire text fragment string if found, else null
     */
    extract = (body: string): string | null => {
        const prefix = this.prefix.replace(/([$^*()+\\|?./[\]])/g, '\\$1');
        const suffix = this.suffix.replace(/([$^*()+\\|?./[\]])/g, '\\$1');
        const textStart = this.textStart.replace(/([$^*()+\\|?./[\]])/g, '\\$1');
        let textEnd = this.textEnd.replace(/([$^*()+\\|?./[\]])/g, '\\$1');
        if (textEnd) textEnd = `.*?${textEnd}`;

        const regex: RegExp = new RegExp(
            `${prefix} *(${textStart}${textEnd}) *${suffix}`,
            'gis'
        );

        const match = body.matchAll(regex).next();
        if (match.value && match.value.length == 2) return (match.value[1] as string).trim();
    };
};

/**
 * Extracts the percent-decoded text fragments from an URL
 * @param url URL to get text fragments from
 * @returns An array of text fragments, empty if not found
 */
export const extractTextFragments = (url: URL | string): TextFragment[] => {
    if (typeof (url) === "string")
        url = new URL(url);

    const hashComponents = url.hash.split(':~:', 2);
    if (hashComponents.length !== 2) return [];
    const textFragmentString = hashComponents[1];

    // Get all text fragments
    const textFragments: TextFragment[] = [];
    for (const match of textFragmentString.matchAll(TEXT_FRAGMENT_REGEX)) {
        const [prefix, textStart, textEnd, suffix] = match
            .slice(1)
            .map((text?: string) => text !== undefined ? decodeURIComponent(text) : undefined);
        if (textStart === undefined)
            throw new TypeError('Starting text missing in text fragment');

        textFragments.push(new TextFragment(textStart, textEnd, prefix, suffix));
    }

    return textFragments;
}

/**
 * Scrape a URL to extract the text fragments inside the URL's hash
 * @param url URL to scrape and extract text fragments from
 * @param pageWaitMs If waitTillRendered is false, wait for specified milliseconds to load site
 * @param waitTillRendered (Experimental) use with dynamically loaded websites which load content using JS
 * @returns Array of text fragment contents
 */
export const scrapeURL = async (
    url: URL | string,
    pageWaitMs?: number,
    waitTillRendered: boolean = false
): Promise<string[]> => {
    if (typeof (url) === "string")
        url = new URL(url);

    const textFragments = extractTextFragments(url);
    if (textFragments.length === 0) return [];

    // If textEnd is not defined for all of the fragments,
    // simply return textStart as extracted. Avoids having to scrape.
    const processingRequired = textFragments
        .every((fragment) => fragment.textEnd);
    if (!processingRequired)
        return textFragments.map((textFragment) => textFragment.textStart);

    // Initialize browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url.toString());

    if (pageWaitMs && !waitTillRendered)
        await page.waitForTimeout(pageWaitMs);

    if (waitTillRendered)
        await waitTillHTMLRendered(page);

    // Get the entire text content
    const pageText = await page.evaluate(() => document.body.textContent);

    await browser.close();

    return textFragments.map((textFragment) => textFragment.extract(pageText));
};