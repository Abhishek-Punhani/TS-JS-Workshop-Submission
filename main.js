const { Cluster } = require("puppeteer-cluster"); // Importing the puppeteer-cluster module
const path = require('path');
const fs = require('fs');
const {PDFDocument, assertEachIs} = require("pdf-lib");
const { url } = require("inspector");

// Function to get formatted date and time
function getFormattedDateTime() {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

const screenshotsDir = path.join(__dirname, "Screenshots");
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

(async () => {
    const cluster = await Cluster.launch({ // Launching the Cluster
        concurrency: Cluster.CONCURRENCY_BROWSER, // Concurrency browser is used to run multiple browsers at the same time.
        maxConcurrency: 6,
        puppeteerOptions: {
            headless: true,
        },
    });
    const screenshotPaths = [] ;
    await cluster.task(async ({ page, data: url }) => { // Defining Task for Puppeteer Cluster
        await page.goto(url); // Navigating to the URL
        console .log('Page URL:', url); // Logging the URL of the page
        const screenshotPath = path.join (__dirname, "Screenshots",`${getFormattedDateTime()}.png`); // Defining the path for the screenshot
        const screen = await page.screenshot({ fullPage: true, path:screenshotPath}); // Taking a screenshot of the page
        console .log(`Screenshot saved to ${screenshotPath} ` ); // Logging the path of the screenshot
        screenshotPaths.push(screenshotPath);

    }).catch(error => {
      console.error(`An error occurred while opening ${url} `, error); // Logging the error
    });

    cluster.queue("https://www.spotify.com/in-en/download/windows/"); // Adding the URL to the queue
    cluster.queue('http://www.google.com/');
    cluster.queue('http://www.wikipedia.org/');
    cluster.queue('https://iitbhu.ac.in/');
    cluster.queue('https://www.copsiitbhu.co.in/');

    await cluster.idle(); // Waiting for completion of all the tasks
    await cluster.close(); // Closing the Cluster

    const pdfDoc = await PDFDocument.create(); // Creating a new PDF Document
    screenshotPaths.forEach(async (screenshotPath) => {
      const pngImgBytes = fs.readFileSync(screenshotPath); // Reading the screenshot file
      const pngImg = await pdfDoc.embedPng(pngImgBytes); // Embedding the PNG image in the PDF Document
      const { width, height } = pngImg; // Getting the width and height of the image
      const page = pdfDoc.addPage([width, height]); // Adding a new page to the PDF
      page.drawImage(pngImg, { 
        x: 0, 
        y: 0,
        width: width,
        height: height}); // Drawing the image on the page
      
    });

    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.join(__dirname, "Screenshots", `screenshots_${getFormattedDateTime()}.pdf`);
    fs.writeFileSync(pdfPath, pdfBytes); // Writing the PDF to the file
    console.log(`PDF saved to ${pdfPath}`);

  
    console.log('All tasks completed !!');

 })(); 