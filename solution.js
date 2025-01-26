//importing cluster class from puppeteer-cluster for opening multiple chromium instances parallelly
const { Cluster } = require("puppeteer-cluster");
//importing fs and path for making sure of screenshot directory and for joining screenshot directory path
const fs = require("fs");
const path = require("path");

//setting a variable to keep track of the screenshot number
let a=1;

(async () => {
  try {
    //check for existence of a screenshot folder
    if (!fs.existsSync(path.join(__dirname, 'screenshots'))) {
      //create screenshot folder incase it doesnt exist
      fs.mkdirSync(path.join(__dirname, 'screenshots'));
    }
    //launching the puppeteer-cluster
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_BROWSER,
      maxConcurrency: 4,
      puppeteerOptions: {
        headless: true,
      },
    });
    //defining the cluster task to visit the different urls
    await cluster.task(async ({ page, data:url }) => {
      //going to the webpage, taking its screenshot and saving the file as the order in which the files are generated
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 20000});
        await page.screenshot({ path: path.join(__dirname, 'screenshots', a + '.png') });
        //increment the screenshot number if url is found
        a++;
      } catch (error) {
        console.error('Failed to capture screenshot for' +url, error);
      }

    });
    // set of URLs which we will search
    const url_list= ['https://github.com/','https://www.google.com/','https://www.youtube.com/','https://www.wikipedia.org/','https://developer.mozilla.org/en-US/','https://www.theodinproject.com/','https://www.primevideo.com/','https://www.netflix.com/']
    url_list.forEach(element => {cluster.queue(element);
    });
    //wait while the tasks complete
    await cluster.idle();
    await cluster.close();

  } catch (error) {
    console.error("An error occurred in the screenshot solution script:", error);
  }
})();