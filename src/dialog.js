/*
(function($, undefined) {
   $.widget('ui.dialog', $.ui.dialog, {
      options: {
         close: true,
         maximize: false,
         minimize: false,
         help: true,
         dblclick: false,
         titlebar: false,
         buttons: {
            close: {
               text: 'close',
               icon: 'ui-icon-closethick',
            },
            maximize: {
               text: 'maximize',
               icon: 'ui-icon-extlink'
            },
            minimize: {
               text: 'minimize',
               icon: 'ui-icon-minus'
            },
            restore: {
               text: 'restore',
               icon: 'ui-icon-newwin'
            },
            help: {
               text: 'help',
               icon: 'ui-icon-help'
            }
         },
         events: {
            load: null,
            beforeCollapse: null,
            beforeMaximize: null,
            beforeMinimize: null,
            beforeRestore": null,
            collapse: null,
            maximize: null,
            minimize: null,
            restore: null,
            help: null
         }
      },
      
      _create: function() {
         var self = this,
         options = self.options,
      },
      
      _initEvents: function() {
         var self = this,
       
         // bind event callbacks which specified at init
         $.each(self.options.events, function(type) {
            if ( $.isFunction( settings.events[type] ) ) {
               $(self).bind(type+".dialog", settings.events[type]);
            }
         });
         
         // maintain chainability
         return self;
      },
      
      
   })
})(jQuery)
*/