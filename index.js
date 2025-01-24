import { Cluster } from "puppeteer-cluster";
import { readdirSync, createWriteStream } from "fs";
import { promises as fs, existsSync } from "fs";
import imageToPDF, { sizes } from "image-to-pdf";
import { join } from "path";


let timestamp;


let h = [
  "https://www.google.com",
  "https://www.facebook.com",
  "https://www.instagram.com",
  "https://www.youtube.com",
];


const screenshots_folder = "./screenshots";
async function prepareScreenshotsFolder(folderPath) {
  if (existsSync(folderPath)) {
    // removing everything inside the folder so the pdf we generated get only require files
    const files = await fs.readdir(folderPath);
    // using loop for removing all dir and files if they exist
    for (const file of files) {
      //getting a filepath properly
      const filePath = join(folderPath, file); 
      //getting what is it file or some directory(folder)
      const stats = await fs.lstat(filePath); 
      if (stats.isDirectory()) {
        // Remove directory if exist
        await fs.rm(filePath, { recursive: true, force: true }); 
      } else {
        // Remove file if exist
        await fs.unlink(filePath); 
      }
    }
  } else {
    // if screenshot folder not exist then create it
    await fs.mkdir(folderPath); 
  }
}

// Calling the function
prepareScreenshotsFolder(screenshots_folder)
  //if everything goes right
  .then(() => console.log("Folder is ready!")) 
  //if there come any sort of error
  .catch(console.error); 

const generated_file_name = (url, extension) => {
  // removing unuse things from the url so we can get the name of the image
  const cleanUrl = url.replace(/https?:\/\//, "").replace(/[^\w.-]/g, "_");
  // taking time stamp for adding in our image
  timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  // now function will return a well organised name for our screenshot and its location
  return `${screenshots_folder}/${cleanUrl}-${timestamp}.${extension}`;
};

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT
    // maxConcurrency: 3,//used for max no of browser we can open at a instance  
  });

  await cluster.task(async ({ page, data: url }) => {
    //take to the website in headless chrome
    await page.goto(url); 
    console.log(`gone to site: ${url}`);
     //creating a file name
    const fileName = generated_file_name(url, "png");
     //taking screenshot of full page and giving it a path where to store it
    await page.screenshot({ path: fileName, fullPage: true });
    console.log(`Screenshot saved: ${fileName}`);
  });
  // getting links from a array by using loop
  for (let index = 0; index < h.length; index++) {
    const element = h[index];
    cluster.queue(element);
  }
  //runing the anonymus function
  await cluster.idle(); 
  //close the headless instance
  await cluster.close(); 
  // calling the pdf function
  pdf(); 
})();

async function pdf() {
  try {
    // read all files from the screenshots folder
    const pages = readdirSync("./screenshots").map(
      (file) => `./screenshots/${file}`
    );

    // convert images to PDF and write to output file 
    imageToPDF(pages, sizes.A4).pipe(createWriteStream(`screenshot-${timestamp}.pdf`));

    console.log(`PDF created successfully as screenshot-${timestamp}.pdf`);
  } catch (error) {
    console.error("Error while creating PDF:", error);
  }
}
