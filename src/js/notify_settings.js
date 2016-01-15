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

$.notify.addStyle('option', {
  html: 
    "<div>" +
      "<div class='clearfix'>" +
        "<div class='title' data-notify-html='title'/>" +
        "<div class='buttons'>" +
          "<button class='no' data-notify-text='no-text'></button>" +
          "<button class='yes' data-notify-text='yes-text'></button>" +
        "</div>" +
      "</div>" +
    "</div>"
});