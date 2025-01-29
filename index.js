const {Cluster} = require("puppeteer-cluster");
const fs = require("fs");
 const path = require('path');
 const {PDFDocument} = require("pdf-lib");
(async ()=>{
    try{

        const screenshotsDir = path.join(__dirname, 'screenshotsDir');
       if(!fs.existsSync(screenshotsDir)){
        fs.mkdirSync(screenshotsDir);
        console.log('Directory created: ', screenshotsDir);
       }
       else{
        console.log('Directory already exists');
       }
       const cluster = await Cluster.launch(
        {
            concurrency: Cluster.CONCURRENCY_BROWSER,
            maxConcurrency: 3,
            puppeteerOptions: { headless: true}
        }
       );
       await cluster.task(async({page, data: url})=>{
        try{
            await page.goto(url, {waitUntil: 'load', timeout: 0});
            const screenshotPath = path.join(screenshotsDir, `${new URL(url).hostname}.png`);
            await page.screenshot({path: screenshotPath});
            console.log(`Screenshot saved for: ${url}`);
        }
        catch(error){
            console.log(`Error occured`);
        }
       });
       const urls = [
        'https://example.com',
        'https://google.com',
        'https://github.com',
       ];
       urls.forEach((url)=>cluster.queue(url));
       await cluster.idle();
       await cluster.close();
       const pdfFilePath = path.join(__dirname, `Screenshots-${Date.now()}.pdf`);
       const pdfDoc = await PDFDocument.create();
       const screenshotFiles = fs.readdirSync(screenshotsDir);
       for (const file of screenshotFiles) {
            const filePath = path.join(screenshotsDir, file);
            const imageBytes = fs.readFileSync(filePath);
            const image = await pdfDoc.embedPng(imageBytes);
            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {x:0, y:0, width: image.width, height: image.height});
       }
       const pdfBytes = await pdfDoc.save();
       fs.writeFileSync(pdfFilePath, pdfBytes);

    }
    catch(error){
        console.error("An error occured in the skeleton script:", error);
    }
})();