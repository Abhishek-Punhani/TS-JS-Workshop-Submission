const {Cluster}=require('puppeteer-cluster')
const fs=require('fs')
const path=require('path')
const { default: cluster } = require('cluster')
const screenshotcreator=()=>{
    const dirpath=path.join(__dirname,'webscreenshots')
    if(!fs.existsSync(dirpath)){
        fs.mkdirSync(dirpath)
    }
    return dirpath
}
const servicestart= async ()=>{
    const screenshotpath=screenshotcreator()
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: 5
    })

    await cluster.task(async ({ page, data: url }) => {
        try {
          console.log(`Navigating to ${url}...`);
          await page.goto(url, { waitUntil: 'load', timeout: 30000 });
          const fileName = `${Date.now()}_${path.basename(url)}.png`;
          const filePath = path.join(screenshotpath, fileName);
          await page.screenshot({ path: filePath, fullPage: true });
          console.log(`Screenshot saved for ${url} at ${filePath}`);
        } catch (error) {
          console.error(`Error capturing screenshot for ${url}:`, error.message);
        }
      });
      const urls = [
        'https://google.com',
        'https://github.com',
        'https://www.wikipedia.org',
        'https://x.com'

      ];
      for (const url of urls) {
        cluster.queue(url);
      }
      await cluster.idle()
      await cluster.close()
      console.log('All screenshots are captured!')
    }
    servicestart().catch(console.error)