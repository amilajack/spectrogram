export default {
  loadTrackSrc(context, src, callback, optProgressCallback) {
    const request = new XMLHttpRequest();
    request.open('GET', src, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously.
    request.onload = function() {
      context.decodeAudioData(
        request.response,
        buffer => {
          callback(buffer);
        },
        e => {
          console.error(e);
        }
      );
    };

    if (optProgressCallback) {
      request.onprogress = function(e) {
        const percent = e.loaded / e.total;
        optProgressCallback(percent);
      };
    }

    request.send();
  },

  // Log scale conversion functions. Cheat sheet:
  // http://stackoverflow.com/questions/19472747/convert-linear-scale-to-logarithmic
  setLogScale(x1, y1, x2, y2) {
    this.b = Math.log(y1 / y2) / (x1 - x2);
    this.a = y1 / Math.exp(this.b * x1);
  },

  lin2log(x) {
    return this.a * Math.exp(this.b * x);
  },

  log2lin(y) {
    return Math.log(y / this.a) / this.b;
  }
};
