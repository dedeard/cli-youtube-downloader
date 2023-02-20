const fs = require('fs');
const inquirer = require('inquirer');
const ytUrl = require('youtube-url');
const ytfps = require('ytfps');
const c = require('ansi-colors');
const download = require('./download');

// Download a song from youtube
const DownloadAFromYoutube = async (v = false) => {
  // Check if the URL is invalid, if so print an error message
  if (v) {
    console.log(c.red('URL is invalid.') + '\n');
  }

  // Create an inquirer dialogue asking for a URL
  const answer = await inquirer.prompt({
    name: 'url',
    type: 'input',
    message: 'Paste the URL:',
  });

  // Check if the URL is valid and replace music.youtube.com with youtube.com
  const url = answer.url.replace('music.youtube.com', 'youtube.com');
  if (!ytUrl.valid(url)) {
    return DownloadAFromYoutube(true);
  }

  //Create directory if it doesn't exist
  const outputPath = './';
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Try downloading the file, catch any errors
  try {
    await download(url, outputPath);
  } catch (e) {
    console.error(e);
    process.exit(0);
  }

  // Call main
  console.log('\n');
  main();
};

// Download playlist from youtube
const DownloadPlaylistFromYoutube = async (v = false) => {
  // Check validity of URL and alert to error if URL is invalid
  if (v) {
    console.log(c.red('Error : ' + v) + '\n');
  }

  // Create an inquirer dialogue asking for a URL
  const answer = await inquirer.prompt({
    name: 'url',
    type: 'input',
    message: 'Paste the URL:',
  });

  // Check if the URL is valid and replace music.youtube.com with youtube.com
  const url = answer.url.replace('music.youtube.com', 'youtube.com');
  let pl;
  try {
    pl = await ytfps(url);
  } catch (e) {
    return DownloadPlaylistFromYoutube(e.message);
  }

  // Create a directory with the playlist title, if it doesn't exist
  const outputPath = './' + pl.title + '/';
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Iterate over each video in the playlist, trying to download them
  for (let i in pl.videos) {
    try {
      await download(pl.videos[i].url, outputPath);
    } catch (e) {
      console.log(e.message);
    }
  }

  // Call main
  console.log('\n');
  main();
};

// Main function handles user input
async function main() {
  // Ask user which action to perform with list input
  const answer = await inquirer.prompt({
    name: 'type',
    type: 'list',
    message: 'Choise one ',
    choices: [
      'Download a song from youtube',
      'Download playlist from youtube',
      'Exit',
    ],
  });

  // Switch based on user input to call respective function
  switch (answer.type) {
    case 'Download a song from youtube':
      DownloadAFromYoutube();
      break;
    case 'Download playlist from youtube':
      DownloadPlaylistFromYoutube();
      break;
    default:
      process.exit(0);
      break;
  }
}

// Initialize main Function
main();
