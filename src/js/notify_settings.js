$.notify.defaults(
{
  // whether to hide the notification on click
  clickToHide: true,
  // whether to auto-hide the notification
  autoHide: true,
  // if autoHide, hide after milliseconds
  autoHideDelay: 10000,
  // show the arrow pointing at the element
  arrowShow: true,
  // arrow size in pixels
  arrowSize: 5,
  // position defines the notification position though uses the defaults below
  position: 'top right',
  // default positions
  elementPosition: 'top right',
  globalPosition: 'top right',
  // default style
  style: 'gisportal',
  // default class (string or [string])
  className: 'info',
  // show animation
  showAnimation: 'slideDown',
  // show animation duration
  showDuration: 400,
  // hide animation
  hideAnimation: 'slideUp',
  // hide animation duration
  hideDuration: 200,
  // padding between element and notification
  gap: 2
}
   );

$.notify.addStyle("gisportal", {
    html: "<div>\n<span data-notify-text></span>\n</div>",
  });

$.notify.addStyle('gisportal-refresh-option', {
  html: 
    "<div data-option='refresh'>" +
      "<div class='clearfix'>" +
        "<div class='title' data-notify-html='title'/>" +
        "<div class='buttons'>" +
          "<button class='no brand small pull-right' data-notify-text='no-text'></button>" +
          "<button class='yes brand small pull-right' data-notify-text='yes-text'></button>" +
        "</div>" +
      "</div>" +
    "</div>"
});

$.notify.addStyle('gisportal-delete-option', {
  html: 
    "<div data-option='delete'>" +
      "<div class='clearfix'>" +
        "<div class='title' data-notify-html='title'/>" +
        "<div class='buttons'>" +
          "<button class='no brand small pull-right' data-notify-text='no-text'></button>" +
          "<button class='yes brand small pull-right' data-notify-text='yes-text'></button>" +
        "</div>" +
      "</div>" +
    "</div>"
});

$.notify.addStyle('gisportal-restore-option', {
  html: 
    "<div data-option='restore'>" +
      "<div class='clearfix'>" +
        "<div class='title' data-notify-html='title'/>" +
        "<div class='buttons'>" +
          "<button class='no brand small pull-right' data-notify-text='no-text'></button>" +
          "<button class='yes brand small pull-right' data-notify-text='yes-text'></button>" +
        "</div>" +
      "</div>" +
    "</div>"
});

$.notify.addStyle('gisportal-close-plot-option', {
  html: 
    "<div data-option='close-plot'>" +
      "<div class='clearfix'>" +
        "<div class='title' data-notify-html='title'/>" +
        "<div class='buttons'>" +
          "<button class='no brand small pull-right' data-notify-text='no-text'></button>" +
          "<button class='yes brand small pull-right' data-notify-text='yes-text'></button>" +
        "</div>" +
      "</div>" +
    "</div>"
});

$.notify.addStyle('gisportal-collab-notification', {
  html: 
    "<div data-option='collab'>" +
      "<div class='clearfix'>" +
        "<div class='title' data-notify-html='title'/>" +
        "<div class='buttons'>" +
          "<a href='javascript:;'' class='hide-opt pull-right' data-notify-text='hide-text'></a>" +
        "</div>" +
      "</div>" +
    "</div>"
});