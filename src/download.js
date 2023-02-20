const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const sanitize = require('sanitize-filename');
const progress = require('progress-stream');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');

// Set the path for the ffmpeg library
ffmpeg.setFfmpegPath(ffmpegPath.path);

/**
 * function download(videoUrl)
 * Downloads the video at the given URL using ytdl, as well as retrieving additional information like title and artist. Uses progress to display a progress bar while downloading.
 *
 * @param {string} videoUrl - The URL link of the video that is being downloaded
 * @returns {Promise} - Returns the promise after the download is completed
 */
function download(videoUrl, outputPath) {
  let self = this;
  return new Promise(async (resolve, reject) => {
    // Initializing progress bar
    let info;
    const bar = new cliProgress.SingleBar({
      format:
        '{message} || ' + colors.blue('{bar} {percentage}%') + ' || {title} ',
      hideCursor: true,
    });
    bar.start(100, 0, { title: videoUrl });
    try {
      // Retrieving video info
      bar.update(0, { message: colors.blue('Getting video informations') });
      info = await ytdl.getInfo(videoUrl, {
        quality: 'highestaudio',
      });

      // Retrieving title and artist based on the video's title
      const videoTitle = sanitize(info.videoDetails.title);

      let artist;
      let title;

      if (videoTitle.indexOf('-') > -1) {
        let temp = videoTitle.split('-');
        if (temp.length >= 2) {
          artist = temp[0].trim();
          title = temp[1].trim();
        }
      } else {
        title = videoTitle;
      }
      bar.update(0, { title: videoTitle });

      // Creating file name for the video
      const fileName = (videoTitle || info.videoId) + '.mp3';

      // Stream
      const stream = ytdl.downloadFromInfo(info, {
        quality: 'highestaudio',
      });

      // Error handling
      stream.on('error', function (err) {
        return reject(err);
      });

      // Start of response
      stream.on('response', function (httpResponse) {
        // Setup of progress module
        const str = progress({
          length: parseInt(httpResponse.headers['content-length']),
          time: self.progressTimeout,
        });

        // Adding progress event listener
        bar.update(0, { message: colors.blue('Downloading') });
        str.on('progress', function (progress) {
          bar.update(progress.percentage);
        });

        // This code adds the command line options for an audio file
        const outputOptions = ['-id3v2_version', '4'];

        // Add 'title' to outputOptions if present
        if (title) outputOptions.concat(['-metadata', 'title=' + title]);

        // Add 'artist' to outputOptions if present
        if (artist) outputOptions.concat(['-metadata', 'artist=' + artist]);

        const audioBitrate = info.formats.find(
          (format) => !!format.audioBitrate
        ).audioBitrate;

        // Starting encoding
        new ffmpeg({ source: stream.pipe(str) })
          .withAudioCodec('libmp3lame')
          .audioBitrate(audioBitrate || 192)
          .toFormat('mp3')
          .outputOptions(...outputOptions)
          .on('error', (err) => {
            bar.update(0, { message: colors.red('Failed') });
            bar.stop();
            return reject(err);
          })
          .on('end', () => {
            bar.update(100, { message: colors.green('Success') });
            bar.stop();
            return resolve();
          })
          .saveToFile(outputPath + fileName);
      });
    } catch (err) {
      return reject(err);
    }
  });
}

module.exports = download;
