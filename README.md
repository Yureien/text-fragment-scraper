# Text Fragment Scraper

Obtains the entire highligted text from URLs (using text fragments) and then returns them as an array.

If the text fragment can be extracted directly from the URL without having to open the website, it does that. Else, it scrapes the website text to extract the entire highlighted text.

Uses [Puppeteer](https://www.npmjs.com/package/puppeteer) to scrape the website.

## Example

```js
scrapeURL("https://web.dev/text-fragments/#:~:text=Text%20Fragments%20let%20you%20specify%20a%20text%20snippet%20in%20the%20URL%20fragment");

// Returns the following
[ 'Text Fragments let you specify a text snippet in the URL fragment' ]
// In the above case, it does not scrape the site since the text is present in URL itself.

scrapeURL("https://web.dev/text-fragments/#:~:text=The%20fact%20though,Text%20Fragments%20solve");

// Returns the following
[
  'The fact though that I had to open the Developer Tools to find the id of an element speaks volumes about the probability this particular section of the page was meant to be linked to by the author of the blog post.What if I want to link to something without an id? Say I want to link to the ECMAScript Modules in Web Workers heading. As you can see in the screenshot below, the <h1> in question does not have an id attribute, meaning there is no way I can link to this heading. This is the problem that Text Fragments solve'
]
// In this case though, it actually scrapes the entire site for this text.
```