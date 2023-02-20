const fs = require('fs');
const inquirer = require('inquirer');
const ytUrl = require('youtube-url');
const ytfps = require('ytfps');
const c = require('ansi-colors');
const Ytmp3 = require('./download');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

// Download a song from youtube
const DownloadAFromYoutube = async (v = false) => {
  if (v) {
    console.log(c.red('URL is invalid.') + '\n');
  }
  const answer = await inquirer.prompt({
    name: 'url',
    type: 'input',
    message: 'Paste the URL:',
  });

  const url = answer.url.replace('music.youtube.com', 'youtube.com');

  if (!ytUrl.valid(url)) {
    return DownloadAFromYoutube(true);
  }

  const outputPath = './';
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  const YD = new Ytmp3({
    ffmpegPath: ffmpeg.path, // FFmpeg binary location
    outputPath,
  });

  try {
    await YD.download(url);
  } catch (e) {
    console.error(e);
    process.exit(0);
  }
  console.log('\n');
  main();
};

// Download playlist from youtube
const DownloadPlaylistFromYoutube = async (v = false) => {
  if (v) {
    console.log(c.red('Error : ' + v) + '\n');
  }
  const answer = await inquirer.prompt({
    name: 'url',
    type: 'input',
    message: 'Paste the URL:',
  });

  const url = answer.url.replace('music.youtube.com', 'youtube.com');
  let pl;
  try {
    pl = await ytfps(url);
  } catch (e) {
    return DownloadPlaylistFromYoutube(e.message);
  }

  const outputPath = './' + pl.title + '/';
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  const YD = new Ytmp3({
    ffmpegPath: ffmpeg.path, // FFmpeg binary location
    outputPath,
  });

  for (let i in pl.videos) {
    try {
      await YD.download(pl.videos[i].url);
    } catch (e) {
      console.log(e.message);
    }
  }

  console.log('\n');
  main();
};

// Main
async function main() {
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

main();
