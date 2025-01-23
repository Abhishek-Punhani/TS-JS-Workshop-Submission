# Puppeteer-Cluster Documentation & Tutorials

## Introduction

This document provides basic information on how to use the Puppeteer-Cluster library along with Puppeteer to capture screenshots concurrently.

## Installation

```bash
npm install puppeteer puppeteer-cluster
```

- [Puppeteer](https://github.com/puppeteer/puppeteer) is a Node library to control headless Chrome or Chromium.
- [Puppeteer-Cluster](https://www.npmjs.com/package/puppeteer-cluster) manages a pool of Chromium instances to process tasks in parallel.

## Basic Steps to Use Puppeteer-Cluster

1. **Import and Launch the Cluster**

   ```javascript
   const { Cluster } = require("puppeteer-cluster");

   (async () => {
     const cluster = await Cluster.launch({
       concurrency: Cluster.CONCURRENCY_BROWSER,
       maxConcurrency: 3,
       puppeteerOptions: {
         headless: true,
       },
     });
   })();
   ```

2. **Define a Task**

   ```javascript
   await cluster.task(async ({ page, data }) => {
     // Use page.goto(...) to visit a URL
     // Then do something like capturing a screenshot
   });
   ```

3. **Queue Tasks**

   ```javascript
   cluster.queue("https://example.com");
   cluster.queue("https://github.com");
   ```

4. **Wait and Close**
   ```javascript
   await cluster.idle();
   await cluster.close();
   ```

## Tutorials / Resources

1. **Puppeteer Documentation**
   - Official Puppeteer-Cluster Package Docs:  
     [https://www.npmjs.com/package/puppeteer-cluster](https://www.npmjs.com/package/puppeteer-cluster)
   - Provides details about controlling headless Chrome/Chromium, available page methods, and more advanced usage examples.

## Common Use Cases

- **High-volume Screenshot Captures**
- **PDF Generation** (using additional libraries like [pdf-lib](https://www.npmjs.com/package/pdf-lib))
- **Web Scraping** for data collection
- **Automation & Testing** in parallel

## Tips for Students

- Experiment with different `maxConcurrency` values to see performance changes.
- Handle errors gracefully; some URLs might fail to load.
- Keep your code well-structured and documented, especially in the `cluster.task(...)` part.
- Consider adding logging or debugging information when capturing many URLs.
