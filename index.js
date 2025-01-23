import { Cluster } from "puppeteer-cluster";
import fs from "fs";
import puppeteer from "puppeteer";
import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
const app=express();
let h=["https://www.google.com",
  "https://www.facebook.com",
  "https://www.netflix.com",
  "https://www.youtube.com"];
const port=3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.urlencoded({ extended: true }));


// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/index.html");


// });



const screenshots_folder = './screenshots';
// if folder not exixt then create a folder name screenshot_folder
if (!fs.existsSync(screenshots_folder)) {
    fs.mkdirSync(screenshots_folder);
}
const generated_file_name = (url, extension) => {
  // removing unuse things from the url so we can get the name of the image
    const cleanUrl = url.replace(/https?:\/\//, '').replace(/[^\w.-]/g, '_');
    // taking time stamp for adding in our image
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // now function will return a well organised name for our screenshot and its location
    return `${screenshots_folder}/${cleanUrl}-${timestamp}.${extension}`;
};


(async ()=>{


  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 3,//no of headless instance of browser we want to open max
  });

  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);//take to the website in headless chrome
    const fileName = generated_file_name(url, 'png');//creating a file name
    await page.screenshot({ path: fileName, fullPage: true });//taking screenshot of full page and giving it a path where to store it
    console.log(`Screenshot saved: ${fileName}`);
  
  });
  // getting links from a array by using loop
  for (let index = 0; index < h.length; index++) {
    const element = h[index];
    cluster.queue(element);   
  }
  
 
  await cluster.idle();//runing the anonymus function
  await cluster.close();//close the headless instance 
})();


