/**
 * This jQuery plugin is used to create interactive walkthroughs, specifically for large web apps.
 *
 * jQuery-Walkthrough has been tested on Chrome 28.
 *
 * @author  Shane Hudson, <shh@pml.ac.uk>
 *          Erwin Yusrizal, <erwin.yusrizal@gmail.com>
 * @date    2013-09-19
 * @version 1.0
 *
 * Heavily modified fork of Erwin Yusrizal's jquery-pagewalkthrough 
 * Licensed MIT
 *
 */

(function ($, window) {

   var _steps = {};
   var _current;
   var _dom;
   var _template;
   var _linkPrev, _linkNext, _linkClose; // Used for click handlers
   var _domLoaded = false;
   var _options;
   
   function _setCookie (c_name, value, exdays) {
      var exdate = new Date();
      exdate.setDate(exdate.getDate() + exdays); // Set expiry date to be exdays after today
      var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
      document.cookie = c_name + "=" + c_value;
   }
   
   
   function _getCookie(c_name) {
      var i, x, y, cookies = document.cookie.split(";");
      for (i = 0; i < cookies.length; i++) {
         x = cookies[i].substr(0, cookies[i].indexOf("="));
         y = cookies[i].substr(cookies[i].indexOf("=") + 1);
         x = x.replace(/^\s+|\s+$/g, "");
         if (x == c_name) {
            return unescape(y);
         }
      }
   }
   
   // render all steps to dom or template
   function render(steps, dom, template)  {
      $.each(steps, function(i, step)  {
         if (dom && template) dom.append(template(step));
         else if (dom) dom.append(step.content);
      });
   }

   function _showCurrent(currentStep) {
      _current = currentStep;
      var _currentDOM = ' li[data-id="' + _current + '"]';
      $('li', _dom).hide().removeClass('active');
      $('li[data-id="' + _current + '"]', _dom).show().addClass('active');
       
      if(_steps[currentStep].next >= 0) $(_linkNext, _currentDOM).show();
      else $(_linkNext, _currentDOM).hide();
      
      if(_linkPrev != null && _steps[currentStep].prev >= 0) $(_linkPrev, _currentDOM).show();
      else $(_linkPrev, _currentDOM).hide();
      
      if (_domLoaded)  {
         _reposition();
      }
      
      $(_dom).off( "click", 'li[data-id="' + _current + '"] ' + _linkPrev + ', li[data-id="' + _current + '"] ' + _linkNext);
      
      if(_linkPrev != null)  {
	      $(_dom).one('click', 'li[data-id="' + _current + '"] ' + _linkPrev, function(e)  {
				_showPrev(_current);
	      });
      }
      
      if(_linkNext != null)  {
	      $(_dom).one('click', 'li[data-id="' + _current + '"] ' + _linkNext, function(e)  {
				_showNext(_current);
	      });
      }
      else  {
	      $(_dom).one('click', 'li[data-id="' + _current + '"] ', function(e)  {
				_showNext(_current);
	      });
      }
      
      if (_steps[currentStep].commands)  {
      	for (var i = 0; i <  _steps[currentStep].commands.length; i++)  {
      		eval(_steps[currentStep].commands[i]);
      	}
      } 
      
      $(_dom).one('click', 'li[data-id="' + _current + '"] ' + _linkClose, function() {
      	$(_dom).hide();
      	if(!_options.ignore_cookies)  {
	      	$('#js-walkthrough-confirm').extendedDialog({
			      resizable: false,
			      height:140,
			      modal: true,
	      		showHelp: false,
			      buttons: {
	     			   "Yes": function() {
			        		_setCookie('walkthrough-hide', false);
							$( this ).extendedDialog( "close" );
			        	},
			        	"No": function() {
			        		_setCookie('walkthrough-hide', true);
	        				$( this ).extendedDialog( "close" );
			        	}
			      }
			    });
      	}
      });
      
   }
   
   function _showNext(currentStep)  {
      var next = _steps[currentStep].next;
      if (next >= 0)  {
      	console.log('Next: ', next);
         //_setCookie('walkthrough-progress', next, 30);  
         _showCurrent(next);
      }
   }
   
   function _showPrev(currentStep)  {
      var prev = _steps[currentStep].prev;
      if (prev >= 0)  {
      	console.log('Previous: ', prev);
 			//_setCookie('walkthrough-progress', prev, 30);  
         _showCurrent(prev);
      }
   }
   
   function _reposition()  {
      if(_domLoaded == true && $('#walkthrough li.active').length > 0)  {
         var currentDOM = $('#walkthrough li.active'); 
         var binding, bindingPosition = {};
         binding = $(_steps[$('#walkthrough li.active').data('id')].binding);
         if (binding.length > 0)  {
         	if (!binding.is(":visible")) binding.show();
         	$('.ui-dialog-titlebar-restore', binding).click();
            bindingPosition = binding.offset();
            currentDOM.removeClass("arrow left right up down");
            
            // TODO: CLEAN UP
            
            // Calculate distances from edges. Does not currently take into consideration other windows.
            var distanceLeft = bindingPosition.left - currentDOM.innerWidth()/2;
            var distanceRight = document.width - bindingPosition.left - binding.innerWidth() - currentDOM.innerWidth()/2;
            var distanceTop = bindingPosition.top - currentDOM.innerHeight();
            var distanceBottom = document.height - distanceTop - binding.innerHeight();
            
            console.log(binding, distanceTop, currentDOM);
            if (distanceTop > distanceLeft && distanceTop > distanceRight && distanceTop > distanceBottom)  {
               currentDOM.offset({ left: (bindingPosition.left + binding.width()/2) - (currentDOM.width()/2), top: distanceTop });
               currentDOM.addClass("arrow down");
            }
            else if (distanceBottom > distanceLeft && distanceBottom > distanceRight)  {
               currentDOM.offset({ left: (bindingPosition.left + binding.innerWidth()/2) - (currentDOM.innerWidth()/2), top: distanceTop + binding.innerHeight() });
               currentDOM.addClass("arrow up");
            }
            else if (distanceLeft > distanceRight ) {
               currentDOM.offset({ left: distanceLeft - 15, top: bindingPosition.top });
               currentDOM.addClass("arrow right");
            }
            else {
               currentDOM.offset({ left: bindingPosition.left + binding.innerWidth() + 15, top: bindingPosition.top });
               currentDOM.addClass("arrow left");
            }
            
            if (currentDOM.position().left < 0)  currentDOM.offset({ left: 0});
            if (currentDOM.position().top < 0)  currentDOM.offset({ top: 0});
            if (currentDOM.position().right > document.width)  currentDOM.offset({ top: document.height - currentDOM.innerHeight()});
            if (currentDOM.position().bottom > document.height)  currentDOM.offset({ right: document.width - currentDOM.innerWidth()});
            
            
         }
      }
   }
   
   $.fn.walkthrough = function (chapter, options) {
      var defaults = {
         'dom' : $('body'),
         'template' : null,
         'prev' : ".js-walkthrough-prev",
         'next' : ".js-walkthrough-next",
         'close' : ".js-walkthrough-close",
         'ignore_cookies' : false
      };
      
      _options = $.extend({}, defaults, options);
      console.log('init');
      _steps = chapter.steps;
      _dom = _options.dom;      
      $('li', _dom).remove();
      _template = _options.template;
      _linkNext = _options.next;
      _linkPrev = _options.prev;
      _linkClose = _options.close;
      
      render(_steps, _dom, _template);
      

		$('body').append('<div class=\"overlay\" style=\"height: 100%; top: 0; left: 0; position: absolute; background: rgba(255,255,255,0.25); width: 100%; z-index: 10001\"></div>');
		$('#walkthrough').on('click', '.js-walkthrough-close', function() { $('.overlay').remove(); });
		
		
      if (_options.ignore_cookies == false)  {
	      // Getting the cookie, checking progress
	      var cookie = _getCookie('walkthrough-hide');
	      // >= 0 to avoid any problems such as undefined etc
	      if (cookie != "true")  {
	         console.log("Walkthrough:", cookie);
	         _showCurrent(0);
	      }
	      else {
	      	$(_dom).hide();
	      	$('.overlay').remove();
	      }
      }  
      else  {
      	var cookie = "false";
	      _showCurrent(0);
	      $(_dom).show();
	      _reposition();
      }
   	$(_linkClose).button({ label: 'Close', icons: { primary: 'ui-icon-closethick'}, text: false });
   };
   
   $.fn.walkthroughCurrentStep = function () { return _current; };
   
   $.fn.walkthroughReposition = function()  {
      _domLoaded = true;
      _reposition();
   };
   
})(jQuery, window);