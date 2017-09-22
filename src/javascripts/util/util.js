const Util = window.Util || {};

Util.loadTrackSrc = function (context, src, callback, opt_progressCallback) {
  const request = new XMLHttpRequest();
  request.open('GET', src, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously.
  request.onload = function () {
    context.decodeAudioData(
      request.response,
      (buffer) => {
        callback(buffer);
      },
      (e) => {
        console.error(e);
      },
    );
  };
  if (opt_progressCallback) {
    request.onprogress = function (e) {
      const percent = e.loaded / e.total;
      opt_progressCallback(percent);
    };
  }

  request.send();
};

// Log scale conversion functions. Cheat sheet:
// http://stackoverflow.com/questions/19472747/convert-linear-scale-to-logarithmic
Util.setLogScale = function (x1, y1, x2, y2) {
  this.b = Math.log(y1 / y2) / (x1 - x2);
  this.a = y1 / Math.exp(this.b * x1);
};

Util.lin2log = function (x) {
  return this.a * Math.exp(this.b * x);
};

Util.log2lin = function (y) {
  return Math.log(y / this.a) / this.b;
};

module.exports = Util;
