const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async function scrapeAndSaveImages() {
  try {
    // Prompt the user to enter the website URL
    rl.question('Enter the URL of the website you want to scrape images from: ', async (websiteUrl) => {
      try {
        // Launch a new browser instance
        const browser = await puppeteer.launch({ headless: true });

        // Create a new page
        const mainPage = await browser.newPage();

        // Navigate to the user-provided URL
        await mainPage.goto(websiteUrl);

        // Perform scraping operations using Puppeteer
        const imageLinks = await mainPage.evaluate(() => {
          // Extract image source URLs from the page
          const imageElements = document.querySelectorAll('img'); // Modify the selector to target the desired images
          const imageLinks = [];

          for (const imageElement of imageElements) {
            const src = imageElement.src;
            imageLinks.push(src);
          }

          return imageLinks;
        });

        // Create the output directory if it doesn't exist
        if (!fs.existsSync('./images')) {
          fs.mkdirSync('./images');
        }

        // Download and save each image
        for (const [index, imageUrl] of imageLinks.entries()) {
          const imagePage = await browser.newPage();
          await imagePage.goto(imageUrl, { waitUntil: 'networkidle0' }); // Wait until the image is fully loaded

          const imageBuffer = await imagePage.screenshot(); // Capture the image as a screenshot

          // Save the image with a unique name
          const imageName = `image_${index + 1}.png`;
          const imagePath = path.join('./images', imageName);
          fs.writeFileSync(imagePath, imageBuffer);

          console.log(`Saved ${imageName}`);
          await imagePage.close();
        }

        await browser.close();

        console.log('Scraped and saved images successfully!');
      } catch (error) {
        console.error('Error scraping images:', error);
      } finally {
        rl.close(); // Close the readline interface
      }
    });
  } catch (error) {
    console.error('Error starting the scraper:', error);
    rl.close(); // Close the readline interface in case of an error
  }
})();

