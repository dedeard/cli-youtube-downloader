const os = require("os");
const ffmpeg = require("fluent-ffmpeg");
const ytdl = require("ytdl-core");
const sanitize = require("sanitize-filename");
const progress = require("progress-stream");
const cliProgress = require("cli-progress");
const colors = require("ansi-colors");

class YoutubeMp3Downloader {
  constructor(options) {
    this.youtubeVideoQuality = options && options.youtubeVideoQuality ? options.youtubeVideoQuality : "highestaudio";
    this.outputPath = options && options.outputPath ? options.outputPath : os.homedir();
    this.outputOptions = options && options.outputOptions ? options.outputOptions : [];

    if (options && options.ffmpegPath) {
      ffmpeg.setFfmpegPath(options.ffmpegPath);
    }
  }

  download(videoUrl) {
    let self = this;

    return new Promise(async (resolve, reject) => {
      let info;

      const bar = new cliProgress.SingleBar({
        format: "{message} || " + colors.blue("{bar} {percentage}%") + " || {title} ",
        hideCursor: true,
      });
      bar.start(100, 0, { title: videoUrl });

      try {
        bar.update(0, { message: colors.blue("Get video informations") });
        info = await ytdl.getInfo(videoUrl, { quality: this.youtubeVideoQuality });
      } catch (err) {
        return reject(err);
      }
      const videoTitle = sanitize(info.videoDetails.title);
      let artist = "Unknown";
      let title = "Unknown";
      const thumbnail = info.videoDetails.thumbnails ? info.videoDetails.thumbnails[0].url : info.videoDetails.thumbnail || null;

      if (videoTitle.indexOf("-") > -1) {
        let temp = videoTitle.split("-");
        if (temp.length >= 2) {
          artist = temp[0].trim();
          title = temp[1].trim();
        }
      } else {
        title = videoTitle;
      }
      bar.update(0, { title: videoTitle });

      const fileName = (videoTitle || info.videoId) + ".mp3";

      // Stream setup
      const streamOptions = {
        quality: self.youtubeVideoQuality,
        requestOptions: self.requestOptions,
      };

      const stream = ytdl.downloadFromInfo(info, streamOptions);

      stream.on("error", function (err) {
        return reject(err);
      });

      stream.on("response", function (httpResponse) {
        // Setup of progress module
        const str = progress({
          length: parseInt(httpResponse.headers["content-length"]),
          time: self.progressTimeout,
        });

        // Add progress event listener
        bar.update(0, { message: colors.blue("Downloading") });
        str.on("progress", function (progress) {
          bar.update(progress.percentage);
        });

        let outputOptions = ["-id3v2_version", "4", "-metadata", "title=" + title, "-metadata", "artist=" + artist];
        if (self.outputOptions) {
          outputOptions = outputOptions.concat(self.outputOptions);
        }

        const audioBitrate = info.formats.find((format) => !!format.audioBitrate).audioBitrate;

        // Start encoding
        new ffmpeg({
          source: stream.pipe(str),
        })
          .audioBitrate(audioBitrate || 192)
          .withAudioCodec("libmp3lame")
          .toFormat("mp3")
          .outputOptions(...outputOptions)
          .on("error", (err) => {
            bar.update(0, { message: colors.red("Failed") });
            bar.stop();
            return reject(err);
          })
          .on("end", () => {
            bar.update(100, { message: colors.green("Success") });
            bar.stop();
            return resolve();
          })
          .saveToFile(self.outputPath + fileName);
      });
    });
  }
}

module.exports = YoutubeMp3Downloader;
