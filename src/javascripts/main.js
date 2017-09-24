import spec3D from './ui/spectrogram';

window.isMobile = false
window.isIOS = false;

$(() => {
  const parseQueryString = function() {
    const q = window.location.search.slice(1).split('&');
    for (let i = 0; i < q.length; ++i) {
      const qi = q[i].split('=');
      q[i] = {};
      q[i][qi[0]] = qi[1];
    }
    return q;
  };

  const getLocalization = function() {
    const q = parseQueryString();
    let lang = 'en';
    for (let i = 0; i < q.length; i++) {
      if (q[i].ln != undefined) {
        lang = q[i].ln;
      }
    }
    const url = `https://gweb-musiclab-site.appspot.com/static/locales/${lang}/locale-music-lab.json`;
    $.ajax({
      url,
      dataType: 'json',
      async: true,
      success(response) {
        $.each(response, (key, value) => {
          const item = $(`[data-name='${key}']`);
          if (item.length > 0) {
            console.log('value.message', value.message);
            item.attr('data-name', value.message);
          }
        });
      },
      error(err) {
        console.warn(err);
      }
    });
  };

  const startup = function() {
    getLocalization();
    window.parent.postMessage('ready', '*');

    const sp = spec3D;
    sp.attached();
    // --------------------------------------------
    $('.music-box__tool-tip').hide(0);
    $('#loadingSound').hide(0);

    $('.music-box__buttons__button').click(function(e) {
      sp.startRender();

      const wasPlaying = sp.isPlaying();
      sp.stop();
      sp.drawingMode = false;

      if ($(this).hasClass('selected')) {
        $('.music-box__buttons__button').removeClass('selected');
      } else {
        $('.music-box__buttons__button').removeClass('selected');
        $(this).addClass('selected');
        // check for start recoding data instruction **********************
        if ($(this).attr('data-mic') !== undefined) {
          if (window.isIOS) {
            // Throw Microphone Error *********************************
            window.parent.postMessage('error2', '*');
            // Remove Selection ***************************************
            $(this).removeClass('selected');
          } else {
            // Show Record Modal Screen *******************************
            $('#record')
              .fadeIn()
              .delay(2000)
              .fadeOut();
            // Start Recording ****************************************
            sp.live();
          }
          // Check for Start drawing data instruction  **********************
        } else if ($(this).attr('data-draw') !== undefined) {
          sp.drawingMode = true;
          $('#drawAnywhere')
            .fadeIn()
            .delay(2000)
            .fadeOut();
          // Check for play audio data instruction **************************
        } else if ($(this).attr('data-src') !== undefined) {
          sp.loopChanged(true);
          $('#loadingMessage').text($(this).attr('data-name'));
          sp.play($(this).attr('data-src'));
        }
      }
    });
  };
  const elm = $('#iosButton');
  if (!window.isIOS) {
    startup();
    elm.addClass('hide');
  } else {
    window.parent.postMessage('loaded', '*');
    elm[0].addEventListener(
      'touchend',
      e => {
        elm.addClass('hide');
        startup();
      },
      false
    );
  }
});
