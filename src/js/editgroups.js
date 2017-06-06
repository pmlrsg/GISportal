gisportal.editGroups = {};

gisportal.editGroups.loadTable = function() {
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

   function loadGroupsTable(groups) {
      var template = gisportal.templates['edit-groups-table'](groups);
      $('.js-edit-groups-html').html(template);

      $('span.js-edit-groups-close').on('click', function() {
         $('div.js-edit-groups-html').empty();
         $('div.js-edit-groups-popup').toggleClass('hidden', true);
      });

      $('.js-create-group-btn, .js-edit-group').on('click', function() {
         var id = $(this).data('group-id');
         var group;
         if (id !== undefined) {
            group = groups[id];
         }
         $('div.js-edit-groups-popup').toggleClass('hidden', true);
         loadEditForm(group);
      });

      $('div.js-edit-groups-popup').toggleClass('hidden', false);
   }

   function loadEditForm(group) {
      if (group && group.members.length) {
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
         close();
         $('div.js-edit-groups-popup').toggleClass('hidden', false);
      });

      $('.js-save-group-btn').on('click', function() {
         var formData = $("form.edit-group-form").serializeArray();
         var groupData = {};
         $(formData).each(function(index, obj) {
            groupData[obj.name] = obj.value;
         });
         groupData.members = groupData.members.replace(/\r?\n|\r|\s/g, '').split(',');

         $.ajax({
            url: gisportal.middlewarePath + '/settings/save_group',
            type: "POST",
            data: JSON.stringify(groupData),
            contentType: "application/json",
            dataType: "json",
            success: function(groups) {
               console.log('success');
               close();
               loadGroupsTable(groups);
            },
            error: function() {
               console.log('error');
            }
         });
      });

      function close() {
         $('div.js-edit-group-form-html').empty();
         $('.js-edit-group-form-popup').toggleClass('hidden', true);
      }
   }
};