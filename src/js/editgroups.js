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

      $('div.js-edit-groups-popup').toggleClass('hidden', true);
      $('.js-edit-group-form-popup').toggleClass('hidden', false);

      $('.js-edit-group-form-close').on('click', function() {
         $('div.js-edit-group-form-html').empty();
         $('.js-edit-group-form-popup').toggleClass('hidden', true);
         $('div.js-edit-groups-popup').toggleClass('hidden', false);
      });
   }
};