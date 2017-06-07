gisportal.editGroups = {};

/**
 * Load and display the manage groups table
 */
gisportal.editGroups.loadTable = function() {
   // Download the groups
   $.ajax({
      url: gisportal.middlewarePath + '/settings/get_groups',
      dataType: 'json',
      success: function(groups) {
         loadGroupsTable(groups);
      },
      error: function() {
         loadGroupsTable();
      }
   });

   /**
    * Setup and display the groups table
    * @param  {Array} groups An array of groups
    */
   function loadGroupsTable(groups) {
      var template = gisportal.templates['edit-groups-table'](groups);
      $('.js-edit-groups-html').html(template);

      $('span.js-edit-groups-close').on('click', function() {
         // Close the table
         $('div.js-edit-groups-html').empty();
         $('div.js-edit-groups-popup').toggleClass('hidden', true);
      });

      $('.js-create-group-btn, .js-edit-group').on('click', function() {
         // Edit a group or create a group
         var id = $(this).data('group-id');
         var group;
         if (id !== undefined) {
            group = groups[id];
         }
         $('div.js-edit-groups-popup').toggleClass('hidden', true);
         loadEditForm(group);
      });

      $('.js-delete-group').on('click', function() {
         // Delete a group
         var this_btn = $(this);

         if (!this_btn.is(".working")) {
            this_btn.notify({
               'title': "Are you sure you want to delete this group?",
               "yes-text": "Yes",
               "no-text": "No"
            }, {
               style: "gisportal-delete-option",
               autoHide: false,
               clickToHide: false
            });

            $(document).one('click', '.notifyjs-gisportal-delete-option-base .no', function() {
               $(this).trigger('notify-hide');
            });

            $(document).one('click', '.notifyjs-gisportal-delete-option-base .yes', function() {
               $(this).trigger('notify-hide');
               this_btn.toggleClass("working", true);

               var id = this_btn.data('group-id');
               var group = groups[id];

               $.ajax({
                  url: gisportal.middlewarePath + '/settings/delete_group?groupname=' + group.groupName,
                  success: function() {
                     this_btn.toggleClass("working", false);
                     this_btn.closest('tr').remove();
                     $.notify("Success\nThe group was deleted successfuly", "success");
                  },
                  error: function() {
                     this_btn.toggleClass("working", false);
                     this_btn.notify("Failed to delete the group", "error");
                  },
               });
            });
         }
      });

      // Display the popup
      $('div.js-edit-groups-popup').toggleClass('hidden', false);
   }

   /**
    * Setup and display the group edit form
    * @param  {Object} group The group to edit
    */
   function loadEditForm(group) {
      if (group && group.members.length) {
         // If a group was provided and it has members
         group.membersString = '';
         for (var i = 0; i < group.members.length; i++) {
            group.membersString += group.members[i];
            if (i != group.members.length - 1) {
               group.membersString += ',\n';
            }
         }
      }

      var template = gisportal.templates['edit-group-form'](group);
      $('.js-edit-group-form-html').html(template);
      $('.js-edit-group-form-popup').toggleClass('hidden', false);

      $('.js-edit-group-form-close').on('click', function() {
         // Close the form
         close();
         $('div.js-edit-groups-popup').toggleClass('hidden', false);
      });

      $('.js-save-group-btn').on('click', function() {
         // Save the group
         var this_btn = $(this);
         var formData = $("form.edit-group-form").serializeArray();
         var groupData = {};

         // Convert the form data into an object
         $(formData).each(function(index, obj) {
            groupData[obj.name] = obj.value;
         });

         // Remove any line breaks and spaces and split the members string into an array
         groupData.members = groupData.members.replace(/\r?\n|\r|\s/g, '').split(',');

         $.ajax({
            url: gisportal.middlewarePath + '/settings/save_group',
            type: "POST",
            data: JSON.stringify(groupData),
            contentType: "application/json",
            dataType: "json",
            success: function(groups) {
               $.notify("Success\nThe group was saved successfuly", "success");
               close();
               loadGroupsTable(groups);
            },
            error: function() {
               this_btn.notify("Failed to save the group", "error");
            }
         });
      });

      /**
       * Close the form
       */
      function close() {
         $('div.js-edit-group-form-html').empty();
         $('.js-edit-group-form-popup').toggleClass('hidden', true);
      }
   }
};