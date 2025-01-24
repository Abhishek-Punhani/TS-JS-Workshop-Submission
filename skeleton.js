/**
 * Skeleton for Web Screenshot Service using Puppeteer-Cluster and PDF generation.
 * Students: Fill in the missing pieces (e.g., concurrency options, PDF creation steps, etc.).
 */

const { Cluster } = require("puppeteer-cluster");
// TODO: import fs, path, and pdf-lib (PDFDocument) libraries if you need them
const fs = require('fs');
const directoryPath = '/home/yourusername';
const { PDFDocument } = require('pdf-lib');
const path = require('path');

(async () => {
  try {
    // 1. Create necessary directories (screenshotsDir)
    // HINT: Use fs.existsSync(...) and fs.mkdirSync(...)
    if(!fs.existsSync(directoryPath)) //checking for existing directory of screenshots
        {
            fs.mkdirSync(directoryPath); //making a new directory named screenshots
        }
    // 2. Launch the Puppeteer-Cluster with the desired concurrency
    // Example:
    const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_BROWSER,
            maxConcurrency: 3,
            puppeteerOptions: { headless: true }
    });
    // 3. Define the cluster task to visit each URL and capture a screenshot
    await cluster.task(async ({ page, data: url }) => {
      const screenshotPath = path.join(directoryPath, `${new URL(url).hostname}.png`); //url.replace(/[^a-zA-Z]/g, '_') + '.png' if ${new URL(url).hostname}.png not working;
      await page.goto(url);
      await page.screenshot({ path: screenshotPath });
    });
    // 4. Queue up a few URLs
    const urls = ["http://www.google.com/","http://www.wikipedia.org/","https://www.youtube.com/"]; //list of urls
    urls.forEach((url) => cluster.queue(url)); //queueing all the urls
    // 5. Wait for cluster tasks to complete
       await cluster.idle();
       await cluster.close();
    // 6.(OPTIONAL) Generate a PDF from the captured images
    const pdfDoc = await PDFDocument.create(); //creating a new pdf doc
        const screenshotImages = fs.readdirSync(directoryPath); //getting all the files inside directoryPath
        for(const file of screenshotImages){ //loop for all files
            const ImagePath = path.join(directoryPath, file);
            const pngImageBytes = fs.readFileSync(ImagePath);
            const pngImage = await pdfDoc.embedPng(pngImageBytes); //embedding the png image in the pdf
            const pngDims = pngImage.scale(0.5) //Image scaled to 50 percent of its original size
            const page = pdfDoc.addPage(); //adding a new page in the pdf
            page.drawImage(pngImage, { //sizing the image accordingly
                x: page.getWidth() / 2 - pngDims.width / 2 + 75,
                y: page.getHeight() / 2 - pngDims.height,
                width: pngDims.width,
                height: pngDims.height,
            });
        }
        const creation = pdfDoc.getCreationDate(); //to get the date of pdf creation
        const Date = creation.toISOString().replace(/[:.]/g, '-'); //formating the string to a reasonable name
        const pdfPath = path.join(directoryPath, `${Date}.pdf`); //naming the pdf
        fs.writeFileSync(pdfPath, await pdfDoc.save()); //saving the pdf doc
    // 7. (OPTIONAL)Clean up the screenshots folder
    screenshotImages.forEach((file) => { //removing all the files
      const ImagePath = path.join(directoryPath, file);
      fs.unlinkSync(ImagePath);
  })
    // 8. Everytime you generate a pdf try naming it with a unique name and can embed the timestamp in the name
  } catch (error) {
    console.error("An error occurred in the skeleton script:", error);
  }
})();
