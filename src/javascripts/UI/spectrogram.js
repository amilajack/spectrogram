import $ from 'jquery';
import Util from '../util/util';
import Player from '../UI/player';
import AnalyserView from '../3D/visualizer';

const spec3D = {
  cxRot: 90,

  drawingMode: false,

  prevX: 0,

  handleTrack(e) {
    switch (e.type) {
      case 'mousedown':
      case 'touchstart':
        // START: MOUSEDOWN ---------------------------------------------
        spec3D.prevX =
          Number(e.pageX) || Number(e.originalEvent.touches[0].pageX);
        $(e.currentTarget).on('mousemove', spec3D.handleTrack);
        $(e.currentTarget).on('touchmove', spec3D.handleTrack);

        if (spec3D.drawingMode == false) return false;
        var freq = spec3D.yToFreq(
          Number(e.pageY) || Number(e.originalEvent.touches[0].pageY)
        );

        if (spec3D.isPlaying()) spec3D.player.setBandpassFrequency(freq);
        else spec3D.player.playTone(freq);
        return false;
        break;
      case 'mousemove':
      case 'touchmove':
        // TRACK --------------------------------------------------------
        var ddx =
          (Number(e.pageX) || Number(e.originalEvent.touches[0].pageX)) -
          spec3D.prevX;
        spec3D.prevX =
          Number(e.pageX) || Number(e.originalEvent.touches[0].pageX);

        if (spec3D.drawingMode) {
          const y = Number(e.pageY) || Number(e.originalEvent.touches[0].pageY);
          var freq = spec3D.yToFreq(y);
          // console.log('%f px maps to %f Hz', y, freq);

          if (spec3D.isPlaying()) spec3D.player.setBandpassFrequency(freq);
          else spec3D.player.playTone(freq);
        } else if (spec3D.isPlaying()) {
          spec3D.cxRot += ddx * 0.2;

          if (spec3D.cxRot < 0) spec3D.cxRot = 0;
          else if (spec3D.cxRot > 90) spec3D.cxRot = 90;

          // spec3D.analyserView.cameraController.yRot = spec3D.easeInOutCubic(spec3D.cxRot / 90, 180 , 90 , 1);
          // spec3D.analyserView.cameraController.zT = spec3D.easeInOutCubic(spec3D.cxRot / 90,-2,-1,1);
          // console.log(spec3D.cxRot / 90);
          // spec3D.analyserView.cameraController.zT = -6 + ((spec3D.cxRot / 90) * 4);
        }
        return false;
        break;
      case 'mouseup':
      case 'touchend':
        // END: MOUSEUP -------------------------------------------------
        $(e.currentTarget).off('mousemove', spec3D.handleTrack);
        $(e.currentTarget).off('touchmove', spec3D.handleTrack);
        if (spec3D.drawingMode == false) return false;

        if (spec3D.isPlaying()) spec3D.player.setBandpassFrequency(null);
        else spec3D.player.stopTone();
        return false;
        break;
    }
  },

  attached() {
    console.log('spectrogram-3d attached');
    Util.setLogScale(20, 20, 20000, 20000);
    spec3D.onResize_();
    spec3D.init_();

    window.addEventListener('resize', spec3D.onResize_.bind(spec3D));
  },

  stop() {
    spec3D.player.stop();
  },

  isPlaying() {
    return !!this.player.source;
  },

  stopRender() {
    spec3D.isRendering = false;
  },

  startRender() {
    if (spec3D.isRendering) {
      return;
    }
    spec3D.isRendering = true;
    spec3D.draw_();
  },

  loopChanged(loop) {
    console.log('loopChanged', loop);
    spec3D.player.setLoop(loop);
  },

  play(src) {
    spec3D.src = src;
    spec3D.player.playSrc(src);
  },

  live() {
    spec3D.player.live();
  },

  init_() {
    // Initialize everything.
    const player = new Player();
    const analyserNode = player.getAnalyserNode();

    const analyserView = new AnalyserView(this.canvas);
    analyserView.setAnalyserNode(analyserNode);
    analyserView.initByteBuffer();

    spec3D.player = player;
    spec3D.analyserView = analyserView;
    $('#spectrogram')
      .on('mousedown', this.handleTrack)
      .on('touchstart', this.handleTrack)
      .on('mouseup', this.handleTrack)
      .on('touchend', this.handleTrack);
  },

  onResize_() {
    console.log('onResize_');
    const canvas = $('#spectrogram')[0];
    spec3D.canvas = canvas;

    // access sibling or parent elements here
    canvas.width = $(window).width();
    canvas.height = $(window).height();

    // Also size the legend canvas.
    const legend = $('#legend')[0];
    legend.width = $(window).width();
    legend.height = $(window).height() - 158;

    spec3D.drawLegend_();
  },

  draw_() {
    if (!spec3D.isRendering) {
      console.log('stopped draw_');
      return;
    }

    spec3D.analyserView.doFrequencyAnalysis();
    requestAnimationFrame(spec3D.draw_.bind(spec3D));
  },

  drawLegend_() {
    // Draw a simple legend.
    const canvas = $('#legend')[0];
    const ctx = canvas.getContext('2d');
    const x = canvas.width - 10;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Roboto';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('20,000 Hz -', x, canvas.height - spec3D.freqToY(20000));
    ctx.fillText('2,000 Hz -', x, canvas.height - spec3D.freqToY(2000));
    ctx.fillText('200 Hz -', x, canvas.height - spec3D.freqToY(200));
    ctx.fillText('20 Hz -', x, canvas.height - spec3D.freqToY(20));
  },

  /**
   * Convert between frequency and the offset on the canvas (in screen space).
   * For now, we fudge this...
   *
   * TODO(smus): Make this work properly with WebGL.
   */
  freqStart: 20,

  freqEnd: 20000,

  padding: 30,

  yToFreq(y) {
    const padding = spec3D.padding;
    const height = $('#spectrogram').height();

    if (
      height < 2 * padding || // The spectrogram isn't tall enough
      y < padding || // Y is out of bounds on top.
      y > height - padding
    ) {
      // Y is out of bounds on the bottom.
      return null;
    }
    const percentFromBottom = 1 - (y - padding) / (height - padding);
    const freq =
      spec3D.freqStart +
      (spec3D.freqEnd - spec3D.freqStart) * percentFromBottom;
    return Util.lin2log(freq);
  },

  // Just an inverse of yToFreq.
  freqToY(logFreq) {
    // Go from logarithmic frequency to linear.
    const freq = Util.log2lin(logFreq);
    const height = $('#spectrogram').height();
    const padding = spec3D.padding;
    // Get the frequency percentage.
    const percent =
      (freq - spec3D.freqStart) / (spec3D.freqEnd - spec3D.freqStart);
    // Apply padding, etc.
    return spec3D.padding + percent * (height - 2 * padding);
  },

  easeInOutCubic(t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
  },

  easeInOutQuad(t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * (--t * (t - 2) - 1) + b;
  },

  easeInOutQuint(t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  },

  easeInOutExpo(t, b, c, d) {
    if (t == 0) return b;
    if (t == d) return b + c;
    if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
  }
};

export default spec3D;
