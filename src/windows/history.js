var history = {
   uid: null,
   $window: null,
   
   init: function(uid) {
      this.uid = uid;
      
      this.$window = $('#' + uid).extendedDialog({
         position: ['center', 'center'],
         width: 650,
         minWidth:650,
         height: 500,
         minHeight: 500,
         resizable: true,
         autoOpen: true,
         showHelp: true,
         showMinimise: true,
         dblclick: "collapse",
         restore: function(e, dlg) {
            // Used to resize content on the dialog.
            $(this).trigger("resize");
         },
         help : function(e, dlg) {
            opec.gritter.showNotification('layerSelector', null);
         }
      });
   }
};
