const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const validUrl = require('valid-url'); // For URL validation

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the URL of the website you want to scrape images from: ', async (websiteUrl) => {
  try {
    // Validate the provided URL
    if (!validUrl.isUri(websiteUrl)) {
      throw new Error('Invalid URL. Please enter a valid URL.');
    }

    // Set the output directory to your local device directory
    const outputDirectory = '/path/to/your/local/directory';

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
        // Validate the image URL
        if (validUrl.isUri(src)) {
          imageLinks.push(src);
        } else {
          console.warn(`Skipping invalid image URL: ${src}`);
        }
      }
    });

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory);
    }

    // Download and save each image
    for (const [index, imageUrl] of imageLinks.entries()) {
      try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
        const imageName = `image_${index + 1}.png`;
        const imagePath = path.join(outputDirectory, imageName);

        const imageStream = fs.createWriteStream(imagePath);
        imageResponse.data.pipe(imageStream);

        console.log(`Saved ${imageName}`);
      } catch (error) {
        console.error(`Error downloading image: ${imageUrl}`, error);
      }
    }

    console.log('Scraped and saved images successfully!');
  } catch (error) {
    console.error('Error scraping images:', error.message);
  } finally {
    rl.close();
  }
});

