/********************************************************
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*********************************************************/



'use strict';

window.isMobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) );
window.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
		  window.webkitRequestAnimationFrame ||
		  window.mozRequestAnimationFrame    ||
		  function( callback ){
			window.setTimeout(callback, 1000 / 60);
		  };
})();

// -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~
var spec3D = require('./ui/spectrogram');
// -~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~

$(function(){
	
	var parseQueryString = function(){
		var q = window.location.search.slice(1).split('&');
		for(var i=0; i < q.length; ++i){
			var qi = q[i].split('=');
			q[i] = {};
			q[i][qi[0]] = qi[1];
		}
		return q;
	}

	var getLocalization = function(){
		var q = parseQueryString();
		var lang = 'en';
		for(var i=0; i < q.length; i++){
			if(q[i].ln != undefined){
				lang = q[i].ln;
			}
		}
		var url = "https://gweb-musiclab-site.appspot.com/static/locales/" + lang + "/locale-music-lab.json";
		$.ajax({
			url: url,
			dataType: "json",
			async: true,
			success: function( response ) {
				$.each(response,function(key,value){
					var item = $("[data-name='"+ key +"']");
					if(item.length > 0){
						console.log('value.message',value.message);
						item.attr('data-name',value.message);
					}
				});
			},
			error: function(err){
				console.warn(err);
			}
		});
	}
	

	var startup = function (){

		getLocalization();
		window.parent.postMessage('ready','*');

		var sp = spec3D;
		sp.attached();
		// --------------------------------------------
		$('.music-box__tool-tip').hide(0);
		$('#loadingSound').hide(0);

		$('.music-box__buttons__button').click(function(e){
			sp.startRender();
			
			var wasPlaying = sp.isPlaying();
			sp.stop();
			sp.drawingMode = false;
			
			if($(this).hasClass('selected')) {
				$('.music-box__buttons__button').removeClass('selected'); 
			}else{
				$('.music-box__buttons__button').removeClass('selected'); 
				$(this).addClass('selected');
				// check for start recoding data instruction **********************
				if ($(this).attr('data-mic')!== undefined) {
					if(window.isIOS){
						// Throw Microphone Error *********************************
						window.parent.postMessage('error2','*');
						// Remove Selection ***************************************
						$(this).removeClass('selected');
					}else{
						// Show Record Modal Screen *******************************
						$('#record').fadeIn().delay(2000).fadeOut();
						// Start Recording ****************************************
						sp.live();
					}
				// Check for Start drawing data instruction  **********************
				}else if ($(this).attr('data-draw') !== undefined) {
					sp.drawingMode = true;
					$('#drawAnywhere').fadeIn().delay(2000).fadeOut();
				// Check for play audio data instruction **************************
				}else if ($(this).attr('data-src') !== undefined) {
					sp.loopChanged( true );
					$('#loadingMessage').text($(this).attr('data-name'));
					sp.play($(this).attr('data-src'));
				}
			}
		})
		
	}
	var elm = $('#iosButton');
	if(!window.isIOS){
		startup();
		elm.addClass('hide');
	}else{
		window.parent.postMessage('loaded','*');
		elm[0].addEventListener('touchend', function(e){
			elm.addClass('hide');
			startup();
		},false);
	}
});
