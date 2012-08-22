/*
 * jQuery UI Multiselect
 *
 * Authors:
 *  Michael Aufreiter (quasipartikel.at)
 *  Yanick Rochon (yanick.rochon[at]gmail[dot]com)
 * 
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 * 
 * http://www.quasipartikel.at/multiselect/
 *
 * 
 * Depends:
 *	ui.core.js
 *	ui.sortable.js
 *
 * Optional:
 * localization (http://plugins.jquery.com/project/localisation)
 * scrollTo (http://plugins.jquery.com/project/ScrollTo)
 * 
 * Todo:
 *  Make batch actions faster
 *  Implement dynamic insertion through remote calls
 */

var defaultItemParser = function(option) {
   return item = {
      text: $(option).text(),
      selected: option.selected,
   };
};

var defaultNodeComparator = function(node1, node2) {
   var text1 = node1.text,
       text2 = node2.text;
   return text1 == text2 ? 0 : (text1 < text2 ? -1 : 1);
};


(function($) {

$.widget("ui.multiselect", {
  options: {
      //sortable: 'left',
      droppable: 'both',
		sortable: true,
		searchable: true,
		doubleClickable: true,
		animated: 'fast',
		show: 'slideDown',
		hide: 'slideUp',
		dividerLocation: 0.6,
      elementType: 'option',
      dynamic: false,
		nodeComparator: defaultNodeComparator,
      itemConverter: defaultItemParser,
	},
	_create: function() {
		//this.element.hide();
		this.id = this.element.attr("id");
		this.container = this.element.addClass("ui-multiselect ui-helper-clearfix ui-widget");
		this.count = 0; // number of currently selected options
		this.selectedContainer = $('<div class="selected"></div>').appendTo(this.container);
		this.availableContainer = $('<div class="available"></div>').appendTo(this.container);
		this.selectedActions = $('<div class="actions ui-widget-header ui-helper-clearfix"><span class="count">0 '+$.ui.multiselect.locale.itemsCount+'</span><a href="#" class="remove-all">'+$.ui.multiselect.locale.removeAll+'</a></div>').appendTo(this.selectedContainer);
		this.availableActions = $('<div class="actions ui-widget-header ui-helper-clearfix"><input type="text" class="search empty ui-widget-content ui-corner-all"/><a href="#" class="add-all">'+$.ui.multiselect.locale.addAll+'</a></div>').appendTo(this.availableContainer);
		this.selectedList = $('<ul class="selected connected-list"><li class="ui-helper-hidden-accessible"></li></ul>').bind('selectstart', function(){return false;}).appendTo(this.selectedContainer);
		this.availableList = $('<ul class="available connected-list"><li class="ui-helper-hidden-accessible"></li></ul>').bind('selectstart', function(){return false;}).appendTo(this.availableContainer);
		
		var that = this;
      this._resize(that);

      $(window).resize(function() {
         that._resize(that);
      });
		
		if ( !this.options.animated ) {
			this.options.show = 'show';
			this.options.hide = 'hide';
		}

      //this.availableList.data('multiselect.cache', {});
      //this.selectedList.data('multiselect.cache', {});

      // sortable / droppable / draggable
      var dragOptions = {
         selected: {
            sortable: ('both' == this.options.sortable || 'left' == this.options.sortable),
            droppable: ('both' == this.options.droppable || 'left' == this.options.droppable)
         },
         available: {
            sortable: ('both' == this.options.sortable || 'right' == this.options.sortable),
            droppable: ('both' == this.options.droppable || 'right' == this.options.droppable)
         }
      };

      //this._prepareLists('selected', 'available', dragOptions);
      //this._prepareLists('available', 'selected', dragOptions);
		
		// init lists
      if(!this.options.dynamic)
		   this._populateLists(this.element.find(this.options.elementType));
		
		// make selection sortable
		if (this.options.sortable) {
			this.selectedList.sortable({
				placeholder: 'ui-state-highlight',
				axis: 'y',
				update: function(event, ui) {
					// apply the new sort order to the original selectbox
					//that.selectedList.find('li').each(function() {
						//if ($(this).data('optionLink'))
							//$(this).data('optionLink').remove().appendTo(that.element);
					//});
				},
				receive: function(event, ui) {
					ui.item.data('optionLink').selected = true;
					// increment count
					that.count += 1;
					that._updateCount();
					// workaround, because there's no way to reference 
					// the new element, see http://dev.jqueryui.com/ticket/4303
					that.selectedList.children('.ui-draggable').each(function() {
						$(this).removeClass('ui-draggable');
						$(this).data('optionLink', ui.item.data('optionLink'));
						$(this).data('idx', ui.item.data('idx'));
						that._applyItemState($(this), true);
					});
			
					// workaround according to http://dev.jqueryui.com/ticket/4088
					setTimeout(function() { ui.item.remove(); }, 1);
				}
			});
		}
		
		// set up livesearch
		if (this.options.searchable) {
			this._registerSearchEvents(this.availableContainer.find('input.search'));
		} else {
			$('.search').hide();
		}
		
		// batch actions
		this.container.find(".remove-all").click(function() {
			that._populateLists(that.element.find('option').removeAttr('selected'));
			return false;
		});
		
		this.container.find(".add-all").click(function() {
			var options = that.element.find('option').not(":selected");
			if (that.availableList.children('li:hidden').length > 1) {
				that.availableList.children('li').each(function(i) {
					if ($(this).is(":visible")) $(options[i-1]).attr('selected', 'selected'); 
				});
			} else {
				options.attr('selected', 'selected');
			}
         if(!this.options.dynamic)
			   that._populateLists(this.element.find(this.options.elementType)); // CHANGE
			return false;
		});
	},
	destroy: function() {
		this.element.show();
		this.container.remove();

		$.Widget.prototype.destroy.apply(this, arguments);
	},
   _prepareLists: function(side, otherSide, opts) {
      var that = this;
      var itemSelected = ('selected' == side);
      var list = this[side+'List'];
      var otherList = this[otherSide+'List'];
      var listDragHelper = opts[otherSide].sortable ? _dragHelper : 'clone';

      list
      .data('multiselect.sortable', opts[side].sortable )
      .data('multiselect.droppable', opts[side].droppable )
      .data('multiselect.draggable', !opts[side].sortable && (opts[otherSide].sortable || opts[otherSide].droppable) );

      if (opts[side].sortable) {
         list.sortable({
            appendTo: this.container,
            connectWith: otherList,
            containment: this.container,
            helper: listDragHelper,
            items: 'li.ui-element',
            revert: !(opts[otherSide].sortable || opts[otherSide].droppable),
            receive: function(event, ui) {
               // DEBUG
               //that._messages(0, "Receive : " + ui.item.data('multiselect.optionLink') + ":" + ui.item.parent()[0].className + " = " + itemSelected);

               // we received an element from a sortable to another sortable...
               if (opts[otherSide].sortable) {
                  var optionLink = ui.item.data('multiselect.optionLink');

                  that._applyItemState(ui.item.hide(), itemSelected);

                  // if the cache already contain an element, remove it
                  if (otherList.data('multiselect.cache')[optionLink.val()]) {
                     delete otherList.data('multiselect.cache')[optionLink.val()];
                  }

                  ui.item.hide();
                  that._setSelected(ui.item, itemSelected, true);
               } 
               else 
               {
                  // the other is droppable only, so merely select the element...
                  setTimeout(function() {
                     that._setSelected(ui.item, itemSelected);
                  }, 10);
               }
            },
            stop: function(event, ui) {
               // DEBUG
               //that._messages(0, "Stop : " + (ui.item.parent()[0] == otherList[0]));
               that._moveOptionNode(ui.item);
            }
         });
      }

      // cannot be droppable if both lists are sortable, it breaks the receive function
      if (!(opts[side].sortable && opts[otherSide].sortable) && (opts[side].droppable || opts[otherSide].sortable || opts[otherSide].droppable)) {
         //alert( side + " is droppable ");
         list.droppable({
            accept: '.ui-multiselect li.ui-element',
            hoverClass: 'ui-state-highlight',
            revert: !(opts[otherSide].sortable || opts[otherSide].droppable),
            greedy: true,
            drop: function(event, ui) {
               // DEBUG
               //that._messages(0, "drop " + side + " = " + ui.draggable.data('multiselect.optionLink') + ":" + ui.draggable.parent()[0].className);

               //alert( "drop " + itemSelected );
               // if no optionLink is defined, it was dragged in
               if (!ui.draggable.data('multiselect.optionLink')) {
                  var optionLink = ui.helper.data('multiselect.optionLink');
                  ui.draggable.data('multiselect.optionLink', optionLink);

                  // if the cache already contain an element, remove it
                  if (list.data('multiselect.cache')[optionLink.val()]) {
                     delete list.data('multiselect.cache')[optionLink.val()];
                  }
                  list.data('multiselect.cache')[optionLink.val()] = ui.draggable;

                  that._applyItemState(ui.draggable, itemSelected);

               // received an item from a sortable to a droppable
               } 
               else if (!opts[side].sortable) 
               {
                  setTimeout(function() {
                     ui.draggable.hide();
                     that._setSelected(ui.draggable, itemSelected);
                  }, 10);
               }
            }
         });
      }
   },
	_populateLists: function(options) {
		this.selectedList.children('.ui-element').remove();
		this.availableList.children('.ui-element').remove();
		this.count = 0;

		var that = this;
		var items = $(options.map(function(i) {
         var converter = that.options.itemConverter;
         var ele = this;
         if(converter) {
            ele = converter(ele);
         }
	      var item = that._getOptionNode(ele).appendTo(ele.selected ? that.selectedList : that.availableList).show();

			if (ele.selected) that.count += 1;
			that._applyItemState(item, ele.selected);
			item.data('idx', i);
			return item[0];
    }));
		
		// update count
		this._updateCount();
		that._filter.apply(this.availableContainer.find('input.search'), [that.availableList]);
   },
	_updateCount: function() {
		this.element.trigger('change');
		this.selectedContainer.find('span.count').text(this.count+" "+$.ui.multiselect.locale.itemsCount);
	},
   _getOptionNode: function(option) { // CHANGE
      //option = $(option);
      var node = $('<li class="ui-state-default ui-element" title="'+option.text+'"><span class="ui-icon"/>'+option.text+'<a href="#" class="action"><span class="ui-corner-all ui-icon"/></a></li>').hide();
      node.data('optionLink', option);
      return node;
   },
	// clones an item with associated data
	// didn't find a smarter away around this
	_cloneWithData: function(clonee) {
		var clone = clonee.clone(false,false);
		clone.data('optionLink', clonee.data('optionLink'));
		clone.data('idx', clonee.data('idx'));
		return clone;
	},
	_setSelected: function(item, selected) {
		item.data('optionLink').selected = selected;

		if (selected) {
			var selectedItem = this._cloneWithData(item);
			item[this.options.hide](this.options.animated, function() { $(this).remove(); });
			selectedItem.appendTo(this.selectedList).hide()[this.options.show](this.options.animated);
			
			this._applyItemState(selectedItem, true);
			return selectedItem;
		} else {
			
			// look for successor based on initial option index
			var items = this.availableList.find('li'), comparator = this.options.nodeComparator;
			var succ = null, i = item.data('idx'), direction = comparator(item, $(items[i]));

			// TODO: test needed for dynamic list populating
			if ( direction ) {
				while (i>=0 && i<items.length) {
					direction > 0 ? i++ : i--;
					if ( direction != comparator(item, $(items[i])) ) {
						// going up, go back one item down, otherwise leave as is
						succ = items[direction > 0 ? i : i+1];
						break;
					}
				}
			} else {
				succ = items[i];
			}
			
			var availableItem = this._cloneWithData(item);
			succ ? availableItem.insertBefore($(succ)) : availableItem.appendTo(this.availableList);
			item[this.options.hide](this.options.animated, function() { $(this).remove(); });
			availableItem.hide()[this.options.show](this.options.animated);
			
			this._applyItemState(availableItem, false);
			return availableItem;
		}
	},
	_applyItemState: function(item, selected) {
		if (selected) {
			if (this.options.sortable)
				item.children('span').addClass('ui-icon-arrowthick-2-n-s').removeClass('ui-helper-hidden').addClass('ui-icon');
			else
				item.children('span').removeClass('ui-icon-arrowthick-2-n-s').addClass('ui-helper-hidden').removeClass('ui-icon');
			item.find('a.action span').addClass('ui-icon-minus').removeClass('ui-icon-plus');
			this._registerRemoveEvents(item.find('a.action'));
			
		} else {
			item.children('span').removeClass('ui-icon-arrowthick-2-n-s').addClass('ui-helper-hidden').removeClass('ui-icon');
			item.find('a.action span').addClass('ui-icon-plus').removeClass('ui-icon-minus');
			this._registerAddEvents(item.find('a.action'));
		}
		
		this._registerDoubleClickEvents(item);
		this._registerHoverEvents(item);
	},
	// taken from John Resig's liveUpdate script
	_filter: function(list) {
		var input = $(this);
		var rows = list.children('li'),
			cache = rows.map(function(){
				
				return $(this).text().toLowerCase();
			});
		
		var term = $.trim(input.val().toLowerCase()), scores = [];
		
		if (!term) {
			rows.show();
		} else {
			rows.hide();

			cache.each(function(i) {
				if (this.indexOf(term)>-1) { scores.push(i); }
			});

			$.each(scores, function() {
				$(rows[this]).show();
			});
		}
	},
   _resize: function(that) {
		// set dimensions
      //that.container.width(that.element.width()+1);
      that.selectedContainer.width(Math.floor(that.container.width()*that.options.dividerLocation) - 1);
      that.availableContainer.width(Math.floor(that.container.width()*(1-that.options.dividerLocation)) - 1);

      // fix list height to match <option> depending on their individual header's heights
      that.selectedList.height(Math.max(that.container.height()-that.selectedActions.height(),1) - 5);
      that.availableList.height(Math.max(that.container.height()-that.availableActions.height(),1) - 5);
   },
	_registerDoubleClickEvents: function(elements) {
		if (!this.options.doubleClickable) return;
		elements.dblclick(function() {
			elements.find('a.action').click();
		});
	},
	_registerHoverEvents: function(elements) {
		elements.removeClass('ui-state-hover');
		elements.mouseover(function() {
			$(this).addClass('ui-state-hover');
		});
		elements.mouseout(function() {
			$(this).removeClass('ui-state-hover');
		});
	},
	_registerAddEvents: function(elements) {
		var that = this;
		elements.click(function() {
			var item = that._setSelected($(this).parent(), true);
			that.count += 1;
			that._updateCount();
			return false;
		});
		
		// make draggable
		if (this.options.sortable) {
  		elements.each(function() {
  			$(this).parent().draggable({
  	      connectToSortable: that.selectedList,
  				helper: function() {
  					var selectedItem = that._cloneWithData($(this)).width($(this).width() - 50);
  					selectedItem.width($(this).width());
  					return selectedItem;
  				},
  				appendTo: that.container,
  				containment: that.container,
  				revert: 'invalid'
  	    });
  		});		  
		}
	},
	_registerRemoveEvents: function(elements) {
		var that = this;
		elements.click(function() {
			that._setSelected($(this).parent(), false);
			that.count -= 1;
			that._updateCount();
			return false;
		});
 	},
	_registerSearchEvents: function(input) {
		var that = this;

		input.focus(function() {
			$(this).addClass('ui-state-active');
		})
		.blur(function() {
			$(this).removeClass('ui-state-active');
		})
		.keypress(function(e) {
			if (e.keyCode == 13)
				return false;
		})
		.keyup(function() {
			that._filter.apply(this, [that.availableList]);
		});
	},
   addItem: function(ele) {
      var that = this;
      var converter = this.options.itemConverter;
      if(converter) {
         ele = converter(ele);
      }
      var item = that._getOptionNode(ele).appendTo(ele.selected ? that.selectedList : that.availableList).show();
		if (this.selected) that.count += 1;
		that._applyItemState(item, ele.selected);
		item.data('idx', 0);
		return item;
   }
});

var _dragHelper = function(event, ui) {
   var item = $(event.target);
   var clone = item.clone().width(item.width());
   clone
      .data('multiselect.optionLink', item.data('multiselect.optionLink'))
      .data('multiselect.list', item.parent() )
      // node ui cleanup
      .find('a').remove();
   return clone;
};
		
$.extend($.ui.multiselect, {
	locale: {
		addAll:'Add all',
		removeAll:'Remove all',
		itemsCount:'items selected'
	}
});


})(jQuery);
