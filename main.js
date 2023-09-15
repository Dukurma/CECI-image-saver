const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the URL of the website you want to scrape images from: ', async (websiteUrl) => {
  try {
    // Define the output directory
    const outputDirectory = './images'; // Change this to your desired directory

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true }); // Recursive flag for nested directories
    }

    // Fetch the HTML content of the website
    const response = await axios.get(websiteUrl);
    const html = response.data;

    // Load the HTML content into Cheerio
    const $ = cheerio.load(html);

    // Select all image elements and extract their src attributes
    const imageLinks = [];
    $('img').each((index, element) => {
      const src = $(element).attr('src');
      if (src) {
        imageLinks.push(src);
      }
    });

    // Download and save each image
    for (const [index, imageUrl] of imageLinks.entries()) {
      const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
      const imageName = `image_${index + 1}.png`;
      const imagePath = path.join(outputDirectory, imageName);

      const imageStream = fs.createWriteStream(imagePath);
      imageResponse.data.pipe(imageStream);

      console.log(`Saved ${imageName}`);
    }

    console.log('Scraped and saved images successfully!');
  } catch (error) {
    console.error('Error scraping images:', error);
  } finally {
    rl.close();
  }
});

