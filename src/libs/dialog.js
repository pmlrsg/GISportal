/*!
 * This is a modified version of jQueryUI's dialog.js
 * 
 * jQuery UI Dialog 1.10.1
 * http://jqueryui.com
 *
 * Copyright 2013 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/dialog/
 *
 * Depends:
 * jquery.ui.core.js
 * jquery.ui.widget.js
 * jquery.ui.button.js
 * jquery.ui.draggable.js
 * jquery.ui.mouse.js
 * jquery.ui.position.js
 * jquery.ui.resizable.js
 * 
 * 
 */
( function($, undefined) {

   var sizeRelatedOptions = {
      buttons : true,
      height : true,
      maxHeight : true,
      maxWidth : true,
      minHeight : true,
      minWidth : true,
      width : true
   }, 
   resizableRelatedOptions = {
      maxHeight : true,
      maxWidth : true,
      minHeight : true,
      minWidth : true
   };

   $.widget("opec.extendedDialog", {
      version : "1.10.1",
      options : {
         appendTo : "body",
         autoOpen : true,
         buttons : [],
         titlebarButtons : [],
         closeOnEscape : true,
         closeText : "close",
         dialogClass : "",
         draggable : true,
         hide : null,
         height : "auto",
         maxHeight : null,
         maxWidth : null,
         minHeight : 150,
         minWidth : 150,
         modal : false,
         position : {
            my : "center",
            at : "center",
            of : window,
            collision : "fit",
            // Ensure the titlebar is always visible
            using : function(pos) {
               var topOffset = $(this).css(pos).offset().top;
               if (topOffset < 0) {
                  $(this).css("top", pos.top - topOffset);
               }
            }
         },
         resizable : true,
         show : null,
         title : null,
         width : 300,

         // Extended options
         showClose : true,
         showMaximise : false,
         showMinimise : false,
         showHelp : true,
         dblclick : false,
         titlebar : false,

         // callbacks
         beforeClose : null,
         close : null,
         drag : null,
         dragStart : null,
         dragStop : null,
         focus : null,
         open : null,
         resize : null,
         resizeStart : null,
         resizeStop : null,
         // Extended callbacks
         load : null,
         beforeCollapse : null,
         beforeMaximise : null,
         beforeMinimise : null,
         beforeRestore : null,
         collapse : null,
         maximise : null,
         minimise : null,
         restore : null,
         help : null
      },

      _create : function() {
         this.originalCss = {
            display : this.element[0].style.display,
            width : this.element[0].style.width,
            minHeight : this.element[0].style.minHeight,
            maxHeight : this.element[0].style.maxHeight,
            height : this.element[0].style.height
         };
         this.originalPosition = {
            parent : this.element.parent(),
            index : this.element.parent().children().index(this.element)
         };
         this.originalTitle = this.element.attr("title");
         this.options.title = this.options.title || this.originalTitle;

         this._createWrapper();

         this.element.show().removeAttr("title").addClass("ui-dialog-content ui-widget-content").appendTo(this.uiDialog);

         this._createTitlebar();
         this._createButtonPane();

         if (this.options.draggable && $.fn.draggable) {
            this._makeDraggable();
         }
         if (this.options.resizable && $.fn.resizable) {
            this._makeResizable();
         }

         this._isOpen = false;
         this._setState("normal");
      },

      _init : function() {
         if (this.options.autoOpen) {
            this.open();
         }
      },

      _appendTo : function() {
         var element = this.options.appendTo;
         if (element && (element.jquery || element.nodeType)) {
            return $(element);
         }
         return this.document.find(element || "body").eq(0);
      },

      _destroy : function() {
         var next, originalPosition = this.originalPosition;

         this._destroyOverlay();

         this.element.removeUniqueId().removeClass("ui-dialog-content ui-widget-content").css(this.originalCss)
         // Without detaching first, the following becomes really slow
         .detach();

         this.uiDialog.stop(true, true).remove();

         if (this.originalTitle) {
            this.element.attr("title", this.originalTitle);
         }

         next = originalPosition.parent.children().eq(originalPosition.index);
         // Don't try to place the dialog next to itself (#8613)
         if (next.length && next[0] !== this.element[0]) {
            next.before(this.element);
         } else {
            originalPosition.parent.append(this.element);
         }
      },

      widget : function() {
         return this.uiDialog;
      },

      disable : $.noop,
      enable : $.noop,

      state : function() {
         return $(this).data("dialog-state");
      },

      collapse : function() {
         var that = this;

         // calculate new dimension
         var newHeight = this.uiDialog.find(".ui-dialog-titlebar").height() + 15;

         // trigger custom event
         that._trigger("beforeCollapse");

         // remember original state
         that._saveSnapshot();

         // modify dialog size (after hiding content)
         that.element.css({
            "resizable" : false,
            "height" : newHeight,
            "maxHeight" : newHeight
         });

         // hide content
         that.uiDialog.find(".ui-dialog-content").hide();
         
         // hide button-pane
         // make title-bar no-wrap
         that.uiDialog.find(".ui-dialog-buttonpane:visible").hide().end().find(".ui-dialog-titlebar").css("white-space", "nowrap").end();

         // mark new state
         that._setState("collapsed");
         // trigger custom event
         that._trigger("collapse");
      },

      /*
      maximise : function() {
         var that = this;

         // caculate new dimension
         var newHeight = $(window).height() - 11;
         var newWidth = $(window).width() - 11;

         // start!
         $(that)
         // trigger custom event
         ._trigger("beforeMaximize")
         // restore to normal state first (when necessary)
         .each(function() {
            if (!that.isNormal()) {
               $(this)._restoreWithoutTriggerEvent();
            }
         })
         // remember original state
         ._saveSnapshot()
         // fix dialog from scrolling
         .dialog("widget").css({
            // (ie6 does not support {position:fixed} ===> simply use {absolute}) ===> Changed, IE6 support not needed
            "position" : "fixed"
         }).find(".ui-dialog-content")
         // show content
         // show button-pane (when minimized/collapsed)
         .show().dialog("widget").find(".ui-dialog-buttonpane").show().end().find(".ui-dialog-content")
         // modify dialog with new config
         .dialog("option", {
            "resizable" : false,
            "draggable" : false,
            "height" : newHeight,
            "width" : newWidth,
            "position" : {
               my : "left bottom",
               at : "left+1 bottom+1"
            }
         })
         // disable draggable-handle (for <titlebar=none> only)
         .dialog("widget").draggable("option", "handle", null).find(".ui-dialog-draggable-handle").css("cursor", "text").end().find(".ui-dialog-content")
         // mark new state
         .dialogExtend("_setState", "maximized")
         // modify dialog buttons according to new state
         .dialogExtend("_toggleButtons")
         // trigger custom event
         .dialogExtend("_trigger", "maximize");

         // Maintain chainability
         return that;
      }, */

      minimise : function() {
         var that = this;

         // caculate new dimension
         var newHeight = this.uiDialog.find(".ui-dialog-titlebar").height() + 15;
         var newWidth = 200;

         // create container for (multiple) minimized dialogs (when necessary)
         if ($("#dialog-fixed-container").length) {
            var fixedContainer = $("#dialog-fixed-container");
         } else {
            var fixedContainer = $('<div id="dialog-fixed-container"></div>').appendTo("body");
         }

         $(fixedContainer).css({
            // (ie6 does not support {position:fixed} ===> simply use {absolute}) ===> Changed, IE6 support not needed
            "position" : "fixed",
            "bottom" : 1,
            "left" : 1,
            "z-index" : 9999,
            "width" : 1 // TODO add width here.
         });

         // trigger custom event
         that._trigger("beforeMinimize");

         // remember original state
         that._saveSnapshot();
         
         // DEBUG
         //console.log(this.options);

         // move dialog from body to container (at lower-left-hand corner)
         that.uiDialog.css({
            // float is essential for stacking dialog when there are many many minimized dialogs
            "float" : "left",
            "margin" : 1,
            "position" : "static"
         });

         that.uiDialog.appendTo(fixedContainer);

         // modify dialog with new config      
         that.uiDialog.css({
            //"resizable" : false,
            //"draggable" : false,
            //"height" : newHeight,
            //"minHeight" : newHeight,
            "width" : newWidth,
            //"minWidth" : newWidth
         });
         
         //that.options.width = newWidth;
         //that.options.minWidth = newWidth;
         
         that.uiDialog.css("height", "auto");
         //that.uiDialog.css("width", "auto");
         
         // avoid title text overlap buttons
         that.uiDialog.find(".ui-dialog-titlebar").each(function() {
            var titlebar = this;
            var buttonPane = that.uiDialog.find(".ui-dialog-titlebar-buttonpane");
            var titleText = that.uiDialog.find(".ui-dialog-title");
            $(titleText).css({
               'overflow' : 'hidden',
               'width' : $(titlebar).width() - $(buttonPane).width() + 10
            });
         }).end();
         
         // hide content
         that.uiDialog.find(".ui-dialog-content").hide();
         
         // hide button-pane
         // make title-bar no-wrap     
         that.uiDialog.find(".ui-dialog-buttonpane:visible").hide().end().find(".ui-dialog-titlebar").css("white-space", "nowrap").end();
         // disable draggable-handle (for <titlebar=none> only)
         //that.uiDialog.draggable("destroy");
         that.uiDialog.draggable("option", "handle", null).find(".ui-dialog-draggable-handle").css("cursor", "text").end().find(".ui-dialog-content");

         // mark new state
         that._setState("minimised");

         // modify dialog button according to new state
         that._toggleButtons();

         // trigger custom event
         that._trigger("minimise");         
      },

      restore : function(event) {
         var that = this;

         // trigger custom event!
         that._trigger("beforeRestore", event);

         // restore to normal
         that._restoreWithoutTriggerEvent();

         // mark new state ===> must set state *AFTER* restore because '_restoreWithoutTriggerEvent' will check 'beforeState'
         that._setState("normal");

         // modify dialog buttons according to new state
         that._toggleButtons();

         // trigger custom event
         that._trigger("restore");
      },

      close : function(event) {
         var that = this;

         if (!this._isOpen || this._trigger("beforeClose", event) === false) {
            return;
         }

         this._isOpen = false;
         this._destroyOverlay();

         if (!this.opener.filter(":focusable").focus().length) {
            // Hiding a focused element doesn't trigger blur in WebKit
            // so in case we have nothing to focus on, explicitly blur the active element
            // https://bugs.webkit.org/show_bug.cgi?id=47182
            $(this.document[0].activeElement).blur();
         }

         this._hide(this.uiDialog, this.options.hide, function() {
            that._trigger("close", event);
         });
      },

      help : function(event) {
         var that = this;

         that._trigger('help', event);
      },

      isOpen : function() {
         return this._isOpen;
      },

      isMinimised : function() {
         var state = this.state();
         return typeof state !== 'undefined' && state == "minimised";
      },

      isMaximised : function() {
         var state = this.state();
         return typeof state !== 'undefined' && state == "maximised";
      },

      isCollapsed : function() {
         var state = this.state();
         return typeof state !== 'undefined' && state == "collapsed";
      },

      isNormal : function() {
         var state = this.state();
         return typeof state !== 'undefined' && state == "normal";
      },

      moveToTop : function() {
         this._moveToTop();
      },

      _moveToTop : function(event, silent) {
         var moved = !!this.uiDialog.nextAll(":visible").insertBefore(this.uiDialog).length;
         if (moved && !silent) {
            this._trigger("focus", event);
         }
         return moved;
      },

      open : function() {
         var that = this;
         if (this._isOpen) {
            if (this._moveToTop()) {
               this._focusTabbable();
            }
            return;
         }

         this._isOpen = true;
         this.opener = $(this.document[0].activeElement);

         this._size();
         this._position();
         this._createOverlay();
         this._moveToTop(null, true);
         this._show(this.uiDialog, this.options.show, function() {
            that._focusTabbable();
            that._trigger("focus");
         });

         this._trigger("open");
      },

      _restoreWithoutTriggerEvent : function() {
         var that = this;

         var beforeState = this.state();

         // restore dialog according to previous state
         beforeState == "maximised" ? this._restoreFromMaximised() : 
         beforeState == "minimised" ? this._restoreFromMinimised() : 
         beforeState == "collapsed" ? this._restoreFromCollapsed() : 
         beforeState == "normal" ? this._restoreFromNormal() : 
         $.error("jQuery.dialogExtend Error : Cannot restore dialog from unknown state '" + beforeState + "'");
      },

      _setState : function(state) {
         var that = this;

         // toggle data state
         $(that).data("dialog-state", state);

         // toggle class
         that.element.removeClass("ui-dialog-normal ui-dialog-maximised ui-dialog-minimised ui-dialog-collapsed");
         that.element.addClass("ui-dialog-" + state);
      },

      _saveSnapshot : function() {
         var that = this, 
         options = this.options;
         
         // remember all configs under normal state
         if (this.isNormal()) {
            $(that).data("original-config-resizable", options.resizable)
            .data("original-config-draggable", options.draggable)
            .data("original-size-height", options.height)
            .data("original-size-width", options.width)
            .data("original-size-maxHeight", options.maxHeight)
            .data("original-size-minHeight", options.minHeight)
            .data("original-size-maxWidth", options.maxWidth)
            .data("original-size-minWidth", options.minWidth)
            .data("original-position-mode", that.uiDialog.css("position"))
            .data("original-position-left", that.uiDialog.offset().left)
            .data("original-position-top", that.uiDialog.offset().top)
            .data("original-titlebar-wrap", that.uiDialog.find(".ui-dialog-titlebar").css("white-space"))
            .data("original-element-height", that.uiDialog.css("height"))
            .data("original-element-width", that.uiDialog.css("width"));
         }
      },

      _loadSnapshot : function() {
         var that = this;
         
         return {
            "config" : {
               "resizable" : $(that).data("original-config-resizable"),
               "draggable" : $(that).data("original-config-draggable")
            },
            "size" : {
               "height" : $(that).data("original-size-height"),
               "width" : $(that).data("original-size-width"),
               "maxHeight" : $(that).data("original-size-maxHeight"),
               "minHeight" : $(that).data("original-size-minHeight"),
               "maxWidth" : $(that).data("original-size-maxWidth"),
               "minWidth" : $(that).data("original-size-minWidth"),
               "elementHeight": $(that).data("original-element-height"),
               "elementWidth": $(that).data("original-element-width")
            },
            "position" : {
               "mode" : $(that).data("original-position-mode"),
               "left" : $(that).data("original-position-left"),
               "top" : $(that).data("original-position-top")
            },
            "titlebar" : {
               "wrap" : $(that).data("original-titlebar-wrap")
            }
         };
      },

      _toggleButtons : function() {
         var that = this;

         // show or hide buttons & decide position
         that.uiDialog.find(".ui-dialog-titlebar-maximise")
            .toggle(!that.isMaximised() && that.options.showMaximise)
         .end()
         .find(".ui-dialog-titlebar-minimise")
            .toggle(!that.isMinimised() && that.options.showMinimise)
         .end()
         .find(".ui-dialog-titlebar-restore")
            .toggle(!that.isNormal() && (that.options.showMaximise || that.options.showMinimise))
            //.css({ "right" : that.isMaximised() ? "1.4em" : that.isMinimised() ? !options.maximise ? "1.4em" : "2.5em" : "-9999em" })
         .end();
      },

      //--------------------------------------------------------------------------

      _restoreFromCollapsed : function() {
         var that = this;
         var original = this._loadSnapshot();
         
         // restore dialog
         that.uiDialog.find(".ui-dialog-content").show();
         
         // show content
         // show button-pane
         // fix title-bar wrap
         that.uiDialog.find(".ui-dialog-buttonpane:hidden")
            .show()
         .end()
         .find(".ui-dialog-titlebar")
            .css("white-space", original.titlebar.wrap)
         .end();

         // Restore config & size or defaults
         that.options.resizable = original.config.resizable;
         that.options.height = original.size.height;
         that.options.maxHeight = original.size.maxHeight;
         that.options.minHeight = original.size.minHeight;
         that.uiDialog.css("height", original.size.elementHeight);
         that.uiDialog.css("width", original.size.elementWidth);
            
         this._size();
         this._position();
      },

      _restoreFromNormal : function() {
         // do nothing actually...
      },

      /*
      _restoreFromMaximized : function() {
         var that = this;
         var original = $(this).dialogExtend("_loadSnapshot");
         // restore dialog
         that.uiDialog
         // free dialog from scrolling
         // fix title-bar wrap (if dialog was minimized/collapsed)
         .css("position", original.position.mode).find(".ui-dialog-titlebar").css("white-space", original.titlebar.wrap).end().find(".ui-dialog-content")
         // restore config & size
         .dialog("option", {
            "resizable" : original.config.resizable,
            "draggable" : original.config.draggable,
            "height" : original.size.height,
            "width" : original.size.width,
            "maxHeight" : original.size.maxHeight
         })
         // restore position *AFTER* size restored
         .dialog("option", {
            "position" : [original.position.left, original.position.top]
         })
         // restore draggable-handle (for <titlebar=none> only)
         .dialog("widget").draggable("option", "handle", $(this).find(".ui-dialog-draggable-handle")).find(".ui-dialog-draggable-handle").css("cursor", "move");
      }, */

      _restoreFromMinimised : function() {
         var that = this;
         var original = this._loadSnapshot();

         // restore dialog
         // move dialog back from container to body
         that.uiDialog.appendTo("body").css({
            "float" : "none",
            "margin" : 0,
            "position" : original.position.mode
         });

         //.find(".ui-dialog-content")

         // revert title text
         that.uiDialog.find(".ui-dialog-title").css({
            "width" : "auto"
         }).end()
         // show content
         .find(".ui-dialog-content").show();

         // show button-pane
         // fix title-bar wrap
         that.uiDialog
            .find(".ui-dialog-buttonpane:hidden")
               .show()
            .end()
            .find(".ui-dialog-titlebar")
               .css("white-space", original.titlebar.wrap)
            .end()
            .find(".ui-dialog-content");
          
         // DEBUG  
         //console.log(original);
            
         // restore config & size
         that.options.resizable = original.config.resizable;
         that.options.draggable = original.config.draggable;
         that.options.height = original.size.height;
         that.options.width = original.size.width;
         that.options.maxHeight = original.size.maxHeight;
         that.options.minHeight = original.size.minHeight;
         that.options.maxWidth = original.size.maxWidth;
         that.options.minWidth = original.size.minWidth;
         that.uiDialog.css("height", original.size.elementHeight);
         that.uiDialog.css("width", original.size.elementWidth);

         // restore position *AFTER* size restored
         that.element.css("position", [original.position.left, original.position.top]);

         // restore draggable-handle (for <titlebar=none> only)
         that.uiDialog.draggable("option", "handle", $(this).find(".ui-dialog-draggable-handle")).find(".ui-dialog-draggable-handle").css("cursor", "move");
         
         this._size();
         this._position();
      },

      //--------------------------------------------------------------------------

      _focusTabbable : function() {
         // Set focus to the first match:
         // 1. First element inside the dialog matching [autofocus]
         // 2. Tabbable element inside the content element
         // 3. Tabbable element inside the buttonpane
         // 4. The close button
         // 5. The dialog itself
         var hasFocus = this.element.find("[autofocus]");
         if (!hasFocus.length) {
            hasFocus = this.element.find(":tabbable");
         }
         if (!hasFocus.length) {
            hasFocus = this.uiDialogButtonPane.find(":tabbable");
         }
         //if ( !hasFocus.length ) {
         //hasFocus = this.uiDialogTitlebarClose.filter(":tabbable");
         //}
         if (!hasFocus.length) {
            hasFocus = this.uiDialog;
         }
         hasFocus.eq(0).focus();
      },

      _keepFocus : function(event) {
         function checkFocus() {
            var activeElement = this.document[0].activeElement, isActive = this.uiDialog[0] === activeElement || $.contains(this.uiDialog[0], activeElement);
            if (!isActive) {
               this._focusTabbable();
            }
         }


         event.preventDefault();
         checkFocus.call(this);
         // support: IE
         // IE <= 8 doesn't prevent moving focus even with event.preventDefault()
         // so we check again later
         this._delay(checkFocus);
      },

      _createWrapper : function() {
         this.uiDialog = $("<div>").addClass("ui-dialog ui-widget ui-widget-content ui-corner-all ui-front " + this.options.dialogClass).hide().attr({
            // Setting tabIndex makes the div focusable
            tabIndex : -1,
            role : "dialog"
         }).appendTo(this._appendTo());

         this._on(this.uiDialog, {
            keydown : function(event) {
               if (this.options.closeOnEscape && !event.isDefaultPrevented() && event.keyCode && event.keyCode === $.ui.keyCode.ESCAPE) {
                  event.preventDefault();
                  this.close(event);
                  return;
               }

               // prevent tabbing out of dialogs
               if (event.keyCode !== $.ui.keyCode.TAB) {
                  return;
               }
               var tabbables = this.uiDialog.find(":tabbable"), first = tabbables.filter(":first"), last = tabbables.filter(":last");

               if ((event.target === last[0] || event.target === this.uiDialog[0]) && !event.shiftKey) {
                  first.focus(1);
                  event.preventDefault();
               } else if ((event.target === first[0] || event.target === this.uiDialog[0]) && event.shiftKey) {
                  last.focus(1);
                  event.preventDefault();
               }
            },
            mousedown : function(event) {
               // OPEC: Stops reordering of minimised dialogs
               if (!this.isMinimised())
                  if (this._moveToTop(event)) {
                     this._focusTabbable();
                  }
            }
         });

         // We assume that any existing aria-describedby attribute means
         // that the dialog content is marked up properly
         // otherwise we brute force the content as the description
         if (!this.element.find("[aria-describedby]").length) {
            this.uiDialog.attr({
               "aria-describedby" : this.element.uniqueId().attr("id")
            });
         }
      },

      _createTitlebar : function() {
         var uiDialogTitle,
            options = this.options;

         this.uiDialogTitlebar = $("<div>").addClass("ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").prependTo(this.uiDialog)            
            // avoid text-highlight when double-click
            .select(function() {
               return false;
            });
            
         this._on(this.uiDialogTitlebar, {
            mousedown : function( event ) {
               // Don't prevent click on close button (#8838)
               // Focusing a dialog that is partially scrolled out of view
               // causes the browser to scroll it into view, preventing the click event
               if (!$(event.target).closest(".ui-dialog-titlebar-close")) {
                  // Dialog isn't getting focus when dragging (#8063)
                  this.uiDialog.focus();
               }
            },
            dblclick : function( event ) {
               if ( options.dblclick && options.dblclick.length ) {
                  if(!this.isNormal())
                     this.restore();
                  else if(options.dblclick == "collapse")
                     this.collapse();
                  else if(options.dblclick == "minimise")
                     this.minimise();
                  //else if(options.dblclick == "maximise")
                     //this.maximise();
               }
            }
         });

         this.uiDialogTitlebarButtonPane = $("<div>").addClass('ui-dialog-titlebar-buttonpane').appendTo(this.uiDialogTitlebar);
         this._createTitlebarButtons();

         uiDialogTitle = $("<span>").uniqueId().addClass("ui-dialog-title").prependTo(this.uiDialogTitlebar);
         this._title(uiDialogTitle);

         this.uiDialog.attr({
            "aria-labelledby" : uiDialogTitle.attr("id")
         });
      },

      _title : function(title) {
         if (!this.options.title) {
            title.html("&#160;");
         }
         title.text(this.options.title);
      },

      _createButtonPane : function() {
         this.uiDialogButtonPane = $("<div>").addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix");

         this.uiButtonSet = $("<div>").addClass("ui-dialog-buttonset").appendTo(this.uiDialogButtonPane);

         this._createButtons();
      },

      _createButtons : function() {
         var that = this, buttons = this.options.buttons;

         // if we already have a button pane, remove it
         this.uiDialogButtonPane.remove();
         this.uiButtonSet.empty();

         if ($.isEmptyObject(buttons) || ($.isArray(buttons) && !buttons.length)) {
            this.uiDialog.removeClass("ui-dialog-buttons");
            return;
         }

         $.each(buttons, function(name, props) {
            var click, buttonOptions;
            props = $.isFunction(props) ? {
               click : props,
               text : name
            } : props;
            // Default to a non-submitting button
            props = $.extend({
               type : "button"
            }, props);
            // Change the context for the click callback to be the main element
            click = props.click;
            props.click = function() {
               click.apply(that.element[0], arguments);
            };
            buttonOptions = {
               icons : props.icons,
               text : props.showText
            };
            delete props.icons;
            delete props.showText;
            $("<button></button>", props).button(buttonOptions).appendTo(that.uiButtonSet);
         });
         this.uiDialog.addClass("ui-dialog-buttons");
         this.uiDialogButtonPane.appendTo(this.uiDialog);
      },

      _createTitlebarButtons : function() {
         var that = this, buttons = this.options.titlebarButtons;

         if ($.isEmptyObject(buttons) || ($.isArray(buttons) && !buttons.length)) {
            buttons = [];
         }

         if ($.isArray(buttons)) {
            
            if (this.options.showHelp)
               buttons.push({
                  text : "help",
                  icons : {
                     primary : "ui-icon-help"
                  },
                  click : function(event) {
                     event.preventDefault();
                     that.help(event);
                  },
                  classes : "ui-dialog-titlebar-help"
               });

            if (this.options.showMinimise)
               buttons.push({
                  text : "minimise",
                  icons : {
                     primary : "ui-icon-minus"
                  },
                  click : function(event) {
                     event.preventDefault();
                     that.minimise(event);
                  },
                  classes : "ui-dialog-titlebar-minimise"
               });

            if (this.options.showRestore || true)
               buttons.push({
                  text : "restore",
                  icons : {
                     primary : "ui-icon-newwin"
                  },
                  click : function(event) {
                     event.preventDefault();
                     that.restore(event);
                  },
                  classes : "ui-dialog-titlebar-restore"
               });
               
            if (this.options.showMaximise)
               buttons.push({
                  text : "maximise",
                  icons : {
                     primary : "ui-icon-extlink"
                  },
                  click : function(event) {
                     event.preventDefault();
                     that.maximise(event);
                  },
                  classes : "ui-dialog-titlebar-maximise"
               });
               
            if (this.options.showClose)
               buttons.push({
                  text : "close",
                  icons : {
                     primary : "ui-icon-closethick"
                  },
                  click : function(event) {
                     event.preventDefault();
                     that.close(event);
                  },
                  classes : "ui-dialog-titlebar-close"
               });
         }

         $.each(buttons, function(name, icons, props, cssclasses) {
            var click, buttonOptions;
            props = $.isFunction(icons) ? {
               click : props,
               text : name,
               icon : icons,
               classes : cssclasses
            } : icons;
            props = $.extend({
               type : "button"
            }, props);
            click = props.click;
            props.click = function() {
               click.apply(that.element[0], arguments);
            };
            buttonOptions = {
               icons : props.icons,
               text : false
            };
            delete props.icons;
            delete props.showText;
            $("<button></button>", props).button(buttonOptions).addClass(props.classes).appendTo(that.uiDialogTitlebarButtonPane);
         });

         that.uiDialogTitlebarButtonPane.find(".ui-dialog-titlebar-restore").hide();
      },

      _makeDraggable : function() {
         var that = this, options = this.options;

         function filteredUi(ui) {
            return {
               position : ui.position,
               offset : ui.offset
            };
         }


         this.uiDialog.draggable({
            cancel : ".ui-dialog-content, .ui-dialog-titlebar-close",
            handle : ".ui-dialog-titlebar",
            containment : "document",
            start : function(event, ui) {
               $(this).addClass("ui-dialog-dragging");
               that._blockFrames();
               that._trigger("dragStart", event, filteredUi(ui));
               this.mousemove = map.events.listeners.mousemove || [];
               map.events.listeners.mousemove = [];
            },
            drag : function(event, ui) {
               that._trigger("drag", event, filteredUi(ui));
            },
            stop : function(event, ui) {
               options.position = [ui.position.left - that.document.scrollLeft(), ui.position.top - that.document.scrollTop()];
               $(this).removeClass("ui-dialog-dragging");
               that._unblockFrames();
               that._trigger("dragStop", event, filteredUi(ui));
               map.events.listeners = this.mousemove;
            }
         });
      },

      _makeResizable : function() {
         var that = this, options = this.options, handles = options.resizable,
         // .ui-resizable has position: relative defined in the stylesheet
         // but dialogs have to use absolute or fixed positioning
         position = this.uiDialog.css("position"), resizeHandles = typeof handles === "string" ? handles : "n,e,s,w,se,sw,ne,nw";
         function filteredUi(ui) {
            return {
               originalPosition : ui.originalPosition,
               originalSize : ui.originalSize,
               position : ui.position,
               size : ui.size
            };
         }


         this.uiDialog.resizable({
            cancel : ".ui-dialog-content",
            containment : "document",
            alsoResize : this.element,
            maxWidth : options.maxWidth,
            maxHeight : options.maxHeight,
            minWidth : options.minWidth,
            minHeight : this._minHeight(),
            handles : resizeHandles,
            start : function(event, ui) {
               $(this).addClass("ui-dialog-resizing");
               that._blockFrames();
               that._trigger("resizeStart", event, filteredUi(ui));
               this.mousemove = map.events.listeners.mousemove || [];
               map.events.listeners.mousemove = [];
            },
            resize : function(event, ui) {
               that._trigger("resize", event, filteredUi(ui));
            },
            stop : function(event, ui) {
               options.height = $(this).height();
               options.width = $(this).width();
               $(this).removeClass("ui-dialog-resizing");
               that._unblockFrames();
               that._trigger("resizeStop", event, filteredUi(ui));
               map.events.listeners.mousemove = this.mousemove;
            }
         }).css("position", position);
      },

      _minHeight : function() {
         var options = this.options;

         return options.height === "auto" ? options.minHeight : Math.min(options.minHeight, options.height);
      },

      _position : function() {
         // Need to show the dialog to get the actual offset in the position plugin
         var isVisible = this.uiDialog.is(":visible");
         if (!isVisible) {
            this.uiDialog.show();
         }
         this.uiDialog.position(this.options.position);
         if (!isVisible) {
            this.uiDialog.hide();
         }
      },

      _setOptions : function(options) {
         var that = this, resize = false, resizableOptions = {};

         $.each(options, function(key, value) {
            that._setOption(key, value);

            if ( key in sizeRelatedOptions) {
               resize = true;
            }
            if ( key in resizableRelatedOptions) {
               resizableOptions[key] = value;
            }
         });

         if (resize) {
            this._size();
            this._position();
         }
         if (this.uiDialog.is(":data(ui-resizable)")) {
            this.uiDialog.resizable("option", resizableOptions);
         }
      },

      _setOption : function(key, value) {
         /*jshint maxcomplexity:15*/
         var isDraggable, isResizable, uiDialog = this.uiDialog;

         if (key === "dialogClass") {
            uiDialog.removeClass(this.options.dialogClass).addClass(value);
         }

         if (key === "disabled") {
            return;
         }

         this._super(key, value);

         if (key === "appendTo") {
            this.uiDialog.appendTo(this._appendTo());
         }

         if (key === "buttons") {
            this._createButtons();
         }

         if (key === "closeText") {
            this.uiDialogTitlebarClose.button({
               // Ensure that we always pass a string
               label : "" + value
            });
         }

         if (key === "draggable") {
            isDraggable = uiDialog.is(":data(ui-draggable)");
            if (isDraggable && !value) {
               uiDialog.draggable("destroy");
            }

            if (!isDraggable && value) {
               this._makeDraggable();
            }
         }

         if (key === "position") {
            this._position();
         }

         if (key === "resizable") {
            // currently resizable, becoming non-resizable
            isResizable = uiDialog.is(":data(ui-resizable)");
            if (isResizable && !value) {
               uiDialog.resizable("destroy");
            }

            // currently resizable, changing handles
            if (isResizable && typeof value === "string") {
               uiDialog.resizable("option", "handles", value);
            }

            // currently non-resizable, becoming resizable
            if (!isResizable && value !== false) {
               this._makeResizable();
            }
         }

         if (key === "title") {
            this._title(this.uiDialogTitlebar.find(".ui-dialog-title"));
         }
      },

      _size : function() {
         // If the user has resized the dialog, the .ui-dialog and .ui-dialog-content
         // divs will both have width and height set, so we need to reset them
         var nonContentHeight, minContentHeight, maxContentHeight, options = this.options;

         // Reset content sizing
         this.element.show().css({
            width : "auto",
            minHeight : 0,
            maxHeight : "none",
            height : 0
         });

         if (options.minWidth > options.width) {
            options.width = options.minWidth;
         }

         // reset wrapper sizing
         // determine the height of all the non-content elements
         nonContentHeight = this.uiDialog.css({
            height : "auto",
            width : options.width
         }).outerHeight();
         minContentHeight = Math.max(0, options.minHeight - nonContentHeight);
         maxContentHeight = typeof options.maxHeight === "number" ? Math.max(0, options.maxHeight - nonContentHeight) : "none";

         if (options.height === "auto") {
            this.element.css({
               minHeight : minContentHeight,
               maxHeight : maxContentHeight,
               height : "auto"
            });
         } else {
            this.element.height(Math.max(0, options.height - nonContentHeight));
         }

         if (this.uiDialog.is(":data(ui-resizable)")) {
            this.uiDialog.resizable("option", "minHeight", this._minHeight());
         }
      },

      _blockFrames : function() {
         this.iframeBlocks = this.document.find("iframe").map(function() {
            var iframe = $(this);

            return $("<div>")
            .css({
            position: "absolute",
            width: iframe.outerWidth(),
            height: iframe.outerHeight()
            })
            .appendTo(iframe.parent())
            .offset(iframe.offset())[0];
         });
      },

      _unblockFrames : function() {
         if (this.iframeBlocks) {
            this.iframeBlocks.remove();
            delete this.iframeBlocks;
         }
      },

      _createOverlay : function() {
         if (!this.options.modal) {
            return;
         }

         if (!$.ui.dialog.overlayInstances) {
            // Prevent use of anchors and inputs.
            // We use a delay in case the overlay is created from an
            // event that we're going to be cancelling. (#2804)
            this._delay(function() {
               // Handle .dialog().dialog("close") (#4065)
               if ($.ui.dialog.overlayInstances) {
                  this.document.bind("focusin.dialog", function(event) {
                     if (!$(event.target).closest(".ui-dialog").length &&
                     // TODO: Remove hack when datepicker implements
                     // the .ui-front logic (#8989)
                     !$(event.target).closest(".ui-datepicker").length) {
                        event.preventDefault();
                        $(".ui-dialog:visible:last .ui-dialog-content").data("ui-dialog")._focusTabbable();
                     }
                  });
               }
            });
         }

         this.overlay = $("<div>").addClass("ui-widget-overlay ui-front").appendTo(this._appendTo());
         this._on(this.overlay, {
            mousedown : "_keepFocus"
         });
         $.ui.dialog.overlayInstances++;
      },

      _destroyOverlay : function() {
         if (!this.options.modal) {
            return;
         }

         if (this.overlay) {
            $.ui.dialog.overlayInstances--;

            if (!$.ui.dialog.overlayInstances) {
               this.document.unbind("focusin.dialog");
            }
            this.overlay.remove();
            this.overlay = null;
         }
      }
   });

   $.ui.dialog.overlayInstances = 0;

   // DEPRECATED
   if ($.uiBackCompat !== false) {
      // position option with array notation
      // just override with old implementation
      $.widget("opec.extendedDialog", $.opec.extendedDialog, {
         _position : function() {
            var position = this.options.position, myAt = [], offset = [0, 0], isVisible;

            if (position) {
               if ( typeof position === "string" || ( typeof position === "object" && "0" in position)) {
                  myAt = position.split ? position.split(" ") : [position[0], position[1]];
                  if (myAt.length === 1) {
                     myAt[1] = myAt[0];
                  }

                  $.each(["left", "top"], function(i, offsetPosition) {
                     if (+myAt[i] === myAt[i]) {
                        offset[i] = myAt[i];
                        myAt[i] = offsetPosition;
                     }
                  });

                  position = {
                     my : myAt[0] + (offset[0] < 0 ? offset[0] : "+" + offset[0]) + " " + myAt[1] + (offset[1] < 0 ? offset[1] : "+" + offset[1]),
                     at : myAt.join(" ")
                  };
               }

               position = $.extend({}, $.ui.dialog.prototype.options.position, position);
            } else {
               position = $.ui.dialog.prototype.options.position;
            }

            // need to show the dialog to get the actual offset in the position plugin
            isVisible = this.uiDialog.is(":visible");
            if (!isVisible) {
               this.uiDialog.show();
            }
            this.uiDialog.position(position);
            if (!isVisible) {
               this.uiDialog.hide();
            }
         }
      });
   }

}(jQuery)); 
