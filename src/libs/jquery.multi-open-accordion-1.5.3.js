/*
 * jQuery UI Multi Open Accordion Plugin
 * Author	: Anas Nakawa (http://anasnakawa.wordpress.com/)
 * Date		: 22-Jul-2011
 * Released Under MIT License
 * You are welcome to enhance this plugin at https://code.google.com/p/jquery-multi-open-accordion/
 */
(function($){
	
	$.widget('ui.multiOpenAccordion', {
		options: {
			active: 0,
			showAll: null,
			hideAll: null,
			showClose: false,
			showDropdown: false,
			$panel: null,
			classes: {
				accordion: 'ui-accordion ui-widget ui-helper-reset',
				h3: 'ui-accordion-header ui-state-default ui-corner-all ui-accordion-icons',
				div: 'ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom',
				divActive: 'ui-accordion-content-active',
				span: 'ui-accordion-header-icon ui-icon ui-icon-triangle-1-e',
				stateDefault: 'ui-state-default',
				stateHover: 'ui-state-hover',
				buttonPane: 'ui-accordion-header-buttonpane',
				buttons: {
               close: 'ui-accordion-header-close ui-corner-all',
               dropdown: 'ui-accordion-header-dropdown ui-corner-all'
				}
			},
			icons: {
            close: 'ui-icon-circle-close',
            dropdown: 'ui-icon-circle-triangle-s'
			},
			events: {
            close: null,
            dropdown: null
			}
		},

		_create: function() {
			var self = this,			
			options  = self.options,			
			$this = self.element,		
			$h3 = $this.children('h3'),		
			$div = $this.children('div');	
				
			$this.addClass(options.classes.accordion);	
				
			$h3.each(function(index) {
				var $this = $(this);
				
           var buttonPane = $('<div class="' +options.classes.buttonPane+ '"></div>');
            $(buttonPane)
               .append('<a class="' +options.classes.buttons.close+ '" href="#"><span class="ui-icon ' +options.icons.close+ '">close</span></a>')
               .append('<a class="' +options.classes.buttons.dropdown+ '" href="#"><span class="ui-icon ' +options.icons.dropdown+ '">dropdown</span></a>')
               .find('.ui-accordion-header-close,.ui-accordion-header-dropdown')
                  .attr("role", "button")
                  .mouseover(function(){ $(this).addClass("ui-state-hover"); })
                  .mouseout(function(){ $(this).removeClass("ui-state-hover"); })
                  .focus(function(){ $(this).addClass("ui-state-focus"); })
                  .blur(function(){ $(this).removeClass("ui-state-focus"); })
               .end()
               .find('.ui-accordion-header-close')
                  .each(function() {
                     if(typeof options.showClose !== "undefined")
                        if($.isFunction(options.showClose))
                           options.showClose(options.$panel) ? $(this).show() : $(this).hide();
                        else
                           options.showClose ? $(this).show() : $(this).hide();
                  })
                  .click(function() {
                     if(options.events.close) { options.events.close($div.attr('id')); }
                     return false;
                  })
               .end()
               .find('.ui-accordion-header-dropdown')
                  .each(function() {
                     if(typeof options.showDropdown !== "undefined")
                        if($.isFunction(options.showDropdown))
                           options.showDropdown(options.$panel) ? $(this).show() : $(this).hide();
                        else
                           options.showDropdown ? $(this).show() : $(this).hide();
                  })
                  .click(function(e) {
                     e.preventDefault();
                     if(options.events.dropdown) { options.events.dropdown($this); }
                     return false;
                  })
               .end();
               
            var span = $('<span class="' + options.classes.span +'"></span>');
            var inputText = $('<input type="text" />').hide().addClass('ui-accordion-header-rename-box').click(function() { return false; });
            var enterText = $('<button></button>').button({ label: 'ok', text: true }).hide().addClass('ui-accordion-header-rename-confirm');
							
				$this.addClass(options.classes.h3).prepend(span, inputText, enterText).append(buttonPane);
				if(self._isActive(index)) {
					self._showTab($this)
				}
				else {
				   self._hideTab($this)
				}
			}); // End h3 each
			
			$this.children('div').each(function(index) {
				var $this = $(this);
				$this.addClass(options.classes.div);
			}); // End each
			
			$h3
            .bind('click', function(e) {
               // Preventing on click to navigate to the top of document
               e.preventDefault();
               var $this = $(this);
               var ui = {
                  tab: $this,
                  content: $this.next('div')
               };
               if(self._trigger('click', null, ui)) {
                  if ($this.hasClass(options.classes.stateDefault)) {
                     self._showTab($this);
                  } else {
                     self._hideTab($this);
                  }
               }
            })
            .bind('dblclick', function(e) {
               e.preventDefault();
               //$(this).find('ui-accordion-header-title').hide();
               console.log("dblclick works");
            })
            .bind('mouseover', function(){
               $(this).addClass(options.classes.stateHover);
            })
            .bind('mouseout', function(){
               $(this).removeClass(options.classes.stateHover);
            });
			
			// Triggering initialized
			self._trigger('init', null, $this);
			
		},
		
		// Destroying the whole multi open widget
		destroy: function() {
			var self = this;
			var $this = self.element;
			var $h3 = $this.children('h3');
			var $div = $this.children('div');
			var options = self.options;
			$this.children('h3').unbind('click mouseover mouseout');
			$this.removeClass(options.classes.accordion);
			$h3.removeClass(options.classes.h3).removeClass('ui-state-default ui-corner-all ui-state-active ui-corner-top').children('span').remove();
			$div.removeClass(options.classes.div + ' ' + options.classes.divActive).show();
		},
		
		// Private helper method that used to show tabs
		_showTab: function($this) {
			var $span = $this.children('span.ui-icon');
			var $div = $this.next();
			var options = this.options;
			$this.removeClass('ui-state-default ui-corner-all').addClass('ui-state-active ui-corner-top');
			$span.removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
			$div.slideDown('fast', function(){
				$div.addClass(options.classes.divActive);
			});
			var ui = {
				tab: $this,
				content: $this.next('div')
			};
			this._trigger('tabShown', null, ui);
			console.log("Open Accordion");
		},
		
		// Private helper method that used to show tabs 
		_hideTab: function($this) {
			var $span = $this.children('span.ui-icon');
			var $div = $this.next();
			var options = this.options;
			$this.removeClass('ui-state-active ui-corner-top').addClass('ui-state-default ui-corner-all');
			$span.removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');
			$div.slideUp('fast', function(){
				$div.removeClass(options.classes.divActive);
			});
			var ui = {
				tab: $this,
				content: $this.next('div')
			};
			this._trigger('tabHidden', null, ui);
			console.log("Close Accordion");
		},
		
		// Helper method to determine wether passed parameter is an index of an
		// active tab or not
		_isActive: function(num) {
			var options = this.options;
			// if array
			if(typeof options.active == "boolean" && !options.active) {
				return false;
			} else {
				if(options.active.length !== undefined) {
					for (var i = 0; i < options.active.length ; i++) {
						if(options.active[i] == num)
							return true;
					}
				} else {
					return options.active == num;
				}
			}
			return false;
		},
		
		// Return object contain currently opened tabs
		_getActiveTabs: function() {
			var $this = this.element;
			var ui = [];
			$this.children('div').each(function(index){
				var $content = $(this);
				if($content.is(':visible')) {
					ui.push({
						index: index,
						tab: $content.prev('h3'),
						content: $content
					});
				}
			});
			return (ui.length === 0 ? undefined : ui);
		},
		
		getActiveTabs: function() {
			var el = this.element;
			var tabs = [];
			el.children('div').each(function(index){
				if($(this).is(':visible')) {
					tabs.push(index);
				}
			});
			return (tabs.length === 0 ? [-1] : tabs);
		},
		
		renameGroup: function() {
         var $this = this.element,
         $h3 = $this.children('h3'),
         $div = $this.children('div'),
         span = $h3.find('.ui-accordion-header-title'),
         input = $h3.find('.ui-accordion-header-rename-box'),
         confirm = $h3.find('.ui-accordion-header-rename-confirm');
         
         span.hide();
         input.val(span.text()).show();
         confirm.show().click(rename);
         
         function rename() {
            input.hide();
            confirm.hide();
            span.text('').text(input.val());
            //$div.attr('id', input.val());
            span.show();
            confirm.unbind('click', rename);
            return false;
         }
		},
		
      _showRename: function() {
		},
		
		_hideRename: function() {
		},
		
		// Setting array of active tabs
		_setActiveTabs: function(tabs) {
			var self = this;
			var $this = this.element;
			if(typeof tabs != 'undefined') {
				$this.children('div').each(function(index){
					var $tab = $(this).prev('h3');
					if(tabs.hasObject(index)) {
						self._showTab($tab);
					} else {
						self._hideTab($tab);
					}
				});
			}
		},
		
		// Active option passed by plugin, this method will read it and convert it into array of tab indexes
		_generateTabsArrayFromOptions: function(tabOption) {
			var tabs = [];
			var self = this;
			var $this = self.element;
			var size = $this.children('h3').size();
			if($.type(tabOption) === 'array') {
				return tabOption;
			} else if($.type(tabOption) === 'number') {
				return [tabOption];
			} else if($.type(tabOption) === 'string') {
				switch(tabOption.toLowerCase()) {
					case 'all':
						var size = $this.children('h3').size();
						for(var n = 0 ; n < size ; n++) {
							tabs.push(n);
						}
						return tabs;
						break;
					case 'none':
						tabs = [-1];
						return tabs;
						break;
					default:
						return undefined;
						break;
				}
			}
		},
		
		// Required method by jquery ui widget framework, used to provide the
		// ability to pass options. Currently only active option is used here, may
		// grow in the future
		_setOption: function(option, value){
			$.Widget.prototype._setOption.apply( this, arguments );
			var el = this.element;
			switch(option) {
				case 'active':
					this._setActiveTabs(this._generateTabsArrayFromOptions(value));
					break;
				case 'getActiveTabs':
					var el = this.element;
					var tabs;
					el.children('div').each(function(index){
						if($(this).is(':visible')) {
							tabs = tabs ? tabs : [];
							tabs.push(index);
						}
					});
					return (tabs.length === 0 ? [-1] : tabs);
					break; // ?? In original
			}
		}
		
	});
	
	// Helper array has object function thanks to @Vinko Vrsalovic
	// http://stackoverflow.com/questions/143847/best-way-to-find-an-item-in-a-javascript-array
   Array.prototype.hasObject = (!Array.indexOf ? function (o) {
      var l = this.length + 1;
      while (l -= 1) {
         if (this[l - 1] === o) {
            return true;
         }
      }
      return false;
   }: function (o) {
      return (this.indexOf(o) !== -1);
   });
	
})(jQuery);
