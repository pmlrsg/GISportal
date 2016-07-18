
/**
 * jQuery drop down function based on http://designwithpc.com/Plugins/ddslick
 * customised slightly to match styles and behavious of the portal
 * 
 */
(function ($) {

    $.fn.ddslick = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exists.');
        }
    };

    var methods = {};

    //Set defauls for the control
    var defaults = {
        data: [],
        keepJSONItemsOnTop: false,
        width: "100%",
        height: null,
        selectText: "",
        initialState: "closed",
        defaultSelectedIndex: null,
        truncateDescription: true,
        imagePosition: "left",
        showSelectedHTML: true,
        clickOffToClose: false,
        onSelected: function () { }
    };

    var ddSelectHtml = '<div class="dd-select"><input class="dd-selected-value" type="hidden" /><a class="dd-selected"></a><span class="dd-pointer dd-pointer-down"></span></div>';
    var ddOptionsHtml = '<ul class="dd-options"></ul>';

    //Public methods 
    methods.init = function (options) {
        //Preserve the original defaults by passing an empty object as the target
        options = $.extend({}, defaults, options);

        //Apply on all selected elements
        return this.each(function () {
            var obj = $(this),
                data = obj.data('ddslick');
            //If the plugin has not been initialized yet
            if (!data) {

                var ddSelect = [], ddJson = options.data;

                //Get data from HTML select options
                obj.find('option').each(function () {
                    var $this = $(this), thisData = $this.data();
                    ddSelect.push({
                        text: $.trim($this.text()),
                        value: $this.val(),
                        selected: $this.is(':selected'),
                        description: thisData.description,
                        imageSrc: thisData.imagesrc, //keep it lowercase for HTML5 data-attributes
                        icon: thisData.icon,
                        optionid: thisData.optionid,
                        tag: thisData.tag,
                        name: thisData.name,
                        tagname: thisData.tagname,
                        tagvalue: thisData.tagvalue,
                    });
                });

                //Update Plugin data merging both HTML select data and JSON data for the dropdown
                if (options.keepJSONItemsOnTop)
                    $.merge(options.data, ddSelect);
                else options.data = $.merge(ddSelect, options.data);

                //Replace HTML select with empty placeholder, keep the original
                var original = obj, placeholder = $('<div id="' + obj.attr('id') + '"></div>');
                obj.replaceWith(placeholder);
                obj = placeholder;

                //Add classes and append ddSelectHtml & ddOptionsHtml to the container
                obj.addClass('dd-container').append(ddSelectHtml).append(ddOptionsHtml);

                //Get newly created ddOptions and ddSelect to manipulate
                ddSelect = obj.find('.dd-select');
                var ddOptions = obj.find('.dd-options');

                //Set widths
                ddOptions.css({ width: options.width });
                ddSelect.css({ width: options.width });
                obj.css({ width: options.width });

                //Set height
                if (options.height !== null)
                    ddOptions.css({ height: options.height, overflow: 'auto' });

                //Add ddOptions to the container. Replace with template engine later.
                $.each(options.data, function (index, item) {
                    if (item.selected) options.defaultSelectedIndex = index;
                    ddOptions.append('<li>' +
                        '<a class="dd-option"' +
                            (item.optionid ? ' data-optionid="' + item.optionid +'"' : '') +
                            (item.tag ? ' data-tag="' + item.tag + '"' : '') +
                            (item.name ? ' data-name="' + item.name +'"' : '') +
                            (item.tagname ? ' data-tagname="' + item.tagname +'"' : '') +
                            (item.tagvalue ? ' data-tagvalue="' + item.tagvalue +'"' : '') +
                            '>' +
                            (item.value ? ' <input class="dd-option-value" type="hidden" value="' + item.value + '" />' : '') +
                            (item.imageSrc ? ' <img class="dd-option-image' + (options.imagePosition == "right" ? ' dd-image-right' : '') + '" src="' + item.imageSrc + '" />' : '') +
                            (item.icon ? ' <span class="dd-option-icon icon-' + item.icon + '" ></span>' : '') +
                            (item.text ? ' <label class="dd-option-text">' + item.text + '</label>' : '') +
                            (item.description ? ' <small class="dd-option-description dd-desc">' + item.description + '</small>' : '') +
                        '</a>' +
                    '</li>');
                });

                //Save plugin data.
                var pluginData = {
                    settings: options,
                    original: original,
                    selectedIndex: -1,
                    selectedItem: null,
                    selectedData: null
                };
                obj.data('ddslick', pluginData);

                //Check if needs to show the select text, otherwise show selected or default selection
                if (options.selectText.length > 0 && options.defaultSelectedIndex === null) {
                    obj.find('.dd-selected').html(options.selectText);
                }
                else {
                    var index = (options.defaultSelectedIndex !== null && options.defaultSelectedIndex >= 0 && options.defaultSelectedIndex < options.data.length) ?
                                options.defaultSelectedIndex
                                : 0;
                    selectIndex(obj, index, false);
                }

                if (options.initialState == "open") {
                    open(obj);
                }
                //EVENTS
                //Displaying options
                obj.find('.dd-select').on('click.ddslick', function () {
                    open(obj);
                });

                //Selecting an option
                obj.find('.dd-option').on('click.ddslick', function () {
                    selectValue(obj, $(this).find('input').val());
                });

                //Click anywhere to close
                if (options.clickOffToClose) {
                    ddOptions.addClass('dd-click-off-close');
                    obj.on('click.ddslick', function (e) { e.stopPropagation(); });
                    $('body').on('click', function () {
                        $('.dd-click-off-close').slideUp(50).siblings('.dd-select').find('.dd-pointer').removeClass('dd-pointer-up');
                    });
                }
            }
        });
    };

    //Public method to select an option by its index
    methods.select = function (options) {
        var doCallback;
        if (typeof options.doCallback !== 'undefined') doCallback = options.doCallback;

        return this.each(function () {
            if (typeof(options.index) !== 'undefined') {
                selectIndex($(this), options.index, doCallback);
            }
            if (typeof(options.value) !== 'undefined') {
                selectValue($(this), options.value, doCallback);
            }
        });
    };

    methods.revertToPreviousValue = function() {
        //return this.each(function() {
            var previousValue = $(this).data('ddslick').previouslySelectedValue;
            if (typeof previousValue !== 'undefined') {
                selectValue($(this), previousValue, false);
            }
        //});
    };

    //Public method to open drop down
    methods.open = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('ddslick');

            //Check if plugin is initialized
            if (pluginData)
                open($this);
        });
    };

    //Public method to close drop down
    methods.close = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('ddslick');

            //Check if plugin is initialized
            if (pluginData)
                close($this);
        });
    };

    //Public method to reset to its original unselected state
    methods.reset = function() {
        return this.each(function() {
            var $this = $(this),
                pluginData = $this.data('ddslick');

            //Check if plugin is initialized
            if (pluginData)
                reset($this); 
        });
    };

    //Public method to destroy. Unbind all events and restore the original Html select/options
    methods.destroy = function () {
        return this.each(function () {
            var $this = $(this),
                pluginData = $this.data('ddslick');

            //Check if already destroyed
            if (pluginData) {
                var originalElement = pluginData.original;
                $this.removeData('ddslick').unbind('.ddslick').replaceWith(originalElement);
            }
        });
    };

    function selectValue(obj, value, doCallback) {

        var ddOptions = obj.find('.dd-options li');
        var selectedOption = obj.find('.dd-option [value="' + value + '"]').closest('li');
        var index = ddOptions.index(selectedOption);

        selectIndex(obj, index, doCallback);
        var params = {
            "event" : "ddslick.selectValue",
            "obj" : obj.attr('id'),
            "value": value,
            "doCallback": doCallback
        };
        gisportal.events.trigger('ddslick.selectValue', params);
    }

    //Private: Select index
    function selectIndex(obj, index, doCallback) {

        // If true, fire the onSelected callback; true by if not specified
        if (typeof doCallback === 'undefined') {
            doCallback = true;
        }

        //Get plugin data
        var pluginData = obj.data('ddslick');

        //Get required elements
        var ddSelected = obj.find('.dd-selected'),
            ddSelectedValue = ddSelected.siblings('.dd-selected-value'),
            ddOptions = obj.find('.dd-options'),
            ddPointer = ddSelected.siblings('.dd-pointer'),
            selectedOption = obj.find('.dd-option').eq(index),
            selectedLiItem = selectedOption.closest('li'),
            settings = pluginData.settings,
            selectedData = pluginData.settings.data[index],
            previouslySelectedValue = obj.find('.dd-option-selected input').val();

        //Highlight selected option
        obj.find('.dd-option').removeClass('dd-option-selected');
        obj.find('li.selected').removeClass('selected');
        selectedOption.addClass('dd-option-selected');
        selectedLiItem.addClass('selected');

        //Update or Set plugin data with new selection
        pluginData.selectedIndex = index;
        pluginData.selectedItem = selectedLiItem;
        pluginData.selectedData = selectedData;        
        pluginData.previouslySelectedValue = previouslySelectedValue;

        //If set to display to full html, add html
        if (settings.showSelectedHTML) {
            ddSelected.html(
                    (selectedData.imageSrc ? '<img class="dd-selected-image' + (settings.imagePosition == "right" ? ' dd-image-right' : '') + '" src="' + selectedData.imageSrc + '" />' : '') +
                    (selectedData.text ? '<label class="dd-selected-text">' + selectedData.text + '</label>' : '') +
                    (selectedData.description ? '<small class="dd-selected-description dd-desc' + (settings.truncateDescription ? ' dd-selected-description-truncated' : '') + '" >' + selectedData.description + '</small>' : '')
                );

        }
        //Else only display text as selection
        else ddSelected.html(selectedData.text);

        //Updating selected option value
        ddSelectedValue.val(selectedData.value);

        //BONUS! Update the original element attribute with the new selection
        pluginData.original.val(selectedData.value);
        obj.data('ddslick', pluginData);

        //Close options on selection
        close(obj);

        //Adjust appearence for selected option
        adjustSelectedHeight(obj);

        //Callback function on selection
        if (doCallback && typeof settings.onSelected == 'function') {
            settings.onSelected.call(this, pluginData);
        }
    }

    //Private: Close the drop down options
    function open(obj) {

        var $this = obj.find('.dd-select'),
            ddOptions = $this.siblings('.dd-options'),
            ddPointer = $this.find('.dd-pointer'),
            wasOpen = ddOptions.is(':visible');

        //Close all open options (multiple plugins) on the page
        $('.dd-click-off-close').not(ddOptions).slideUp(50);
        $('.dd-pointer').removeClass('dd-pointer-up');

        if (wasOpen) {
            ddOptions.slideUp('fast');
            ddPointer.removeClass('dd-pointer-up');
            ddPointer.parent().removeClass('active');
        }
        else {
            ddOptions.slideDown('fast');
            ddPointer.addClass('dd-pointer-up');
            ddPointer.parent().addClass('active');
        }

        //Fix text height (i.e. display title in center), if there is no description
        adjustOptionsHeight(obj);

        var params = {
            "event" : "ddslick.open",
            "obj" : obj.attr('id')
        };
        gisportal.events.trigger('ddslick.open', params);
    }

    //Private: Close the drop down options
    function close(obj) {
        //Close drop down and adjust pointer direction
        obj.find('.dd-options').slideUp(50);
        obj.find('.dd-pointer').removeClass('dd-pointer-up').parent().removeClass('active');
        var params = {
            "event" : "ddslick.close",
            "obj" : obj.attr('id')
        };
        gisportal.events.trigger('ddslick.close', params);
    }

    //Private: Adjust appearence for selected option (move title to middle), when no desripction
    function adjustSelectedHeight(obj) {

        //Get height of dd-selected
        var lSHeight = obj.find('.dd-select').css('height');

        //Check if there is selected description
        var descriptionSelected = obj.find('.dd-selected-description');
        var imgSelected = obj.find('.dd-selected-image');
        if (descriptionSelected.length <= 0 && imgSelected.length > 0) {
            //obj.find('.dd-selected-text').css('lineHeight', lSHeight);        // this makes the line height expand each time the drop down is opened and closed
        }
    }

    function reset(obj) {
        var pluginData = obj.data('ddslick');

        pluginData.selectedData = null;
        pluginData.selectedIndex = -1;
        obj.find('.dd-selected').html(pluginData.settings.selectText);
        obj.find('.dd-option-selected').removeClass('dd-option-selected');
        obj.find('li.selected').removeClass('selected');

        gisportal.events.trigger('ddslick.reset', obj);
    }

    //Private: Adjust appearence for drop down options (move title to middle), when no desripction
    function adjustOptionsHeight(obj) {
        obj.find('.dd-option').each(function () {
            var $this = $(this);
            var lOHeight = $this.css('height');
            var descriptionOption = $this.find('.dd-option-description');
            var imgOption = obj.find('.dd-option-image');
            if (descriptionOption.length <= 0 && imgOption.length > 0) {
                //$this.find('.dd-option-text').css('lineHeight', lOHeight);        // this makes the line height expand each time the drop down is opened and closed
            }
        });
    }

})(jQuery);