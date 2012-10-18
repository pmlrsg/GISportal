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

var defaultItemParser = function(item) {
   return option = {
      text: item.text,
      selected: item.selected(item.text),
      title: item.title ? item.title : item.text,
   };
};

var defaultNodeComparator = function(node1, node2) {
   var text1 = node1.text,
       text2 = node2.text;
   return text1 == text2 ? 0 : (text1 < text2 ? -1 : 1);
};

var defaultAddAll = function (that, func) {
   func(that);
};


(function($) {

$.widget("ui.multiselect", {
  options: {
      // -- Sortable and droppable --
      sortable: 'none',
      droppable: 'both',
      // -- Search -- 
      searchable: true,
      searchDelay: 400,
      remoteUrl: null,
      remoteParams: {},
      // -- Animation --
      speed: 'fast',
      show: 'slideDown',
      hide: 'slideUp',
      // -- Ui --
      dividerLocation: 0.5,
      // -- Callbacks -- 
      nodeComparator: defaultNodeComparator,
      itemParser: defaultItemParser,
      nodeInserted: null,
      addall: defaultAddAll,
   },
	_create: function() {
      //this.element.hide();
      this.busy = false;
      this.id = this.element.attr("id");
      this.container = this.element.addClass("ui-multiselect ui-helper-clearfix ui-widget");
      this.selectedContainer = $('<div class="ui-widget-content list-container selected"></div>').appendTo(this.container);
      this.availableContainer = $('<div class="ui-widget-content list-container available"></div>').appendTo(this.container);
      this.selectedActions = $('<div class="actions ui-widget-header ui-helper-clearfix"><span class="count">0 '+$.ui.multiselect.locale.itemsCount+'</span><a href="#" class="remove-all">'+$.ui.multiselect.locale.removeAll+'</a></div>').appendTo(this.selectedContainer);
      this.availableActions = $('<div class="actions ui-widget-header ui-helper-clearfix"><span class="busy">' + $.ui.multiselect.locale.busy +'</span><input type="text" placeholder="Search here..." class="search empty ui-widget-content ui-corner-all"/><a href="#" class="add-all">'+$.ui.multiselect.locale.addAll+'</a></div>').appendTo(this.availableContainer);
      this.selectedList = $('<ul class="selected list"><li class="ui-helper-hidden-accessible"></li></ul>').bind('selectstart', function(){return false;}).appendTo(this.selectedContainer);
      this.availableList = $('<ul class="available list"><li class="ui-helper-hidden-accessible"></li></ul>').bind('selectstart', function(){return false;}).appendTo(this.availableContainer);
		
      var that = this;

      // initialise data cache
      this.availableList.data('multiselect.cache', {});
      this.selectedList.data('multiselect.cache', {});		

      if ( !this.options.speed ) {
         this.options.show = 'show';
         this.options.hide = 'hide';
      }

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

      this._prepareLists('selected', 'available', dragOptions);
      this._prepareLists('available', 'selected', dragOptions);

      // set up livesearch
      if (this.options.searchable) {
         this._registerSearchEvents(this.availableContainer.find('input.search'), true);
      } 
      else 
      {
         $('.search').hide();
      }

      this._setBusy(false);

      this.container.find(".remove-all").bind('click.multiselect', function() { that.selectNone(); return false; });
      this.container.find(".add-all").bind('click.multiselect', function() { that.selectAll(); return false; });

      this._resize(that);

      $(document).unbind('resize').resize(function(e, ui) {
         that._resize(e, ui);
      });
   },

/*====================================================================================*/
//                                    Public
/*====================================================================================*/

   destroy: function() {
      this.element.show();
      this.container.remove();

      $.Widget.prototype.destroy.apply(this, arguments);
   },
   isBusy: function() {
      return !!this.busy;
   },
   isSelected: function(item) {
      if (this.enabled()) 
      {
         return !!this._findItem(item, this.selectedList);
      } 
      else 
      {
         return null;
      }
   },
   // get all selected values in an array
   selectedValues: function() {
      return $.map( this.element.find('option[selected]'), function(item,i) { return $(item).val(); });
   },
	// get/set enable state
   enabled: function(state, msg) {
      if (undefined !== state) {
         if (state) {
            this.container.unblock();
            this.element.removeAttr('disabled');
         } 
         else 
         {
            this.container.block({message:msg||null,overlayCSS:{backgroundColor:'#fff',opacity:0.4,cursor:'default'}});
            this.element.attr('disabled', true);
         }
      }
      return !this.element.attr('disabled');
   },
   selectAll: function() {
      if (this.enabled()) {
         var func = function(that) {that._batchSelect(that.availableList.children('li.ui-element:visible'), true);};
         this.options.addall(this, func);           
      }
   },
   selectNone: function() {
      if (this.enabled()) {
         this._batchSelect(this.selectedList.children('li.ui-element:visible'), false);
      }
   },
   select: function(text) {
      if (this.enabled()) {
         var available = this._findItem(text, this.availableList);
         if ( available ) {
            this._setSelected(available, true);
         }
      }
   },
   deselect: function(text) {
      if (this.enabled()) {
         var selected = this._findItem(text, this.selectedList);
         if ( selected ) {
            this._setSelected(selected, false);
         }
      }
   },
   search: function(query) {
      if (!this.busy && this.enabled() && this.options.searchable) {
         var input = this.availableActions.children('input:first');
         input.val(query);
         input.trigger('keydown.multiselect');
      }
   },	
   // insert new <option> and _populate
   // @return int the number of options added
   addItem: function(data) {
      if (this.enabled()) {
         this._setBusy(true);

         // format data
         var elements = [];
         if (data = this.options.itemParser(data)) {
            // check if the option does not exist already
            if (true) {
               elements.push(data);
            }
         }

         if (elements.length > 0) {
            this._populateLists($(elements));
         }

         this._filter(this.availableList.children('li.ui-element'));

         this._setBusy(false);
         return elements.length;
      } 
      else 
      {
         return false;
      }
   },

/*====================================================================================*/
//                                    Private
/*====================================================================================*/
   _setData: function(key, value) {
      switch (key) {
         // special treatement must be done for theses values when changed
         case 'dividerLocation':
            this.options.dividerLocation = value;
            this._refreshDividerLocation();
            break;
         case 'searchable':
            this.options.searchable = value;
            this._registerSearchEvents(this.availableContainer.find('input.search'), false);
            break;

         case 'droppable':
         case 'sortable':
            // readonly options
            this._messages(
               $.ui.multiselect.constants.MESSAGE_WARNING,
               $.ui.multiselect.locale.errorReadonly,
               {option: key}
            );
         default:
            // default behavior
            this.options[key] = value;
            break;
      }
   },	
   _ui: function(type) {
      var uiObject = {sender: this.element};
      switch (type) {
         // events: messages
         case 'message':
            uiObject.type = arguments[1];
            uiObject.message = arguments[2];
            break;

         // events: selected, deselected
         case 'selection':
            uiObject.option = arguments[1];
            break;
      }
      return uiObject;
   },
   _messages: function(type, msg, params) {
      console.info("message: " + msg + " " + params);
      //this._trigger('messages', null, this._ui('message', type, $.tmpl(msg, params)));
   },
   _refreshDividerLocation: function() {
      this.selectedContainer.width(Math.floor(this.element.width()*this.options.dividerLocation));
      this.availableContainer.width(Math.floor(this.element.width()*(1-this.options.dividerLocation)));
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
               //that._messages(0, "Receive : " + ui.item.data('multiselect.itemLink') + ":" + ui.item.parent()[0].className + " = " + itemSelected);

               // we received an element from a sortable to another sortable...
               if (opts[otherSide].sortable) {
                  var optionLink = ui.item.data('multiselect.itemLink');

                  that._applyItemState(ui.item.hide(), itemSelected);

                  // if the cache already contain an element, remove it
                  if (otherList.data('multiselect.cache')[optionLink.text]) {
                     delete otherList.data('multiselect.cache')[optionLink.text];
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
               //that._messages(0, "drop " + side + " = " + ui.draggable.data('multiselect.itemLink') + ":" + ui.draggable.parent()[0].className);

               //alert( "drop " + itemSelected );
               // if no optionLink is defined, it was dragged in
               if (!ui.draggable.data('multiselect.itemLink')) {
                  var optionLink = ui.helper.data('multiselect.itemLink');
                  ui.draggable.data('multiselect.itemLink', optionLink);

                  // if the cache already contain an element, remove it
                  if (list.data('multiselect.cache')[optionLink.text]) {
                     delete list.data('multiselect.cache')[optionLink.text];
                  }
                  list.data('multiselect.cache')[optionLink.text] = ui.draggable;

                  that._applyItemState(ui.draggable, itemSelected);

               // received an item from a sortable to a droppable
               } 
               else if (!opts[side].sortable) 
               {
                  setTimeout(function() {
                     if(!ui.draggable.parent().hasClass(side)) {
                        ui.draggable.hide();
                        that._setSelected(ui.draggable, itemSelected);
                     }
                  }, 10);
               }
            }
         });
      }
   },
   _populateLists: function(options) {
      this._setBusy(true);

      var that = this;
      // do this async so the browser actually display the waiting message
      setTimeout(function() {
         $(options.each(function(i) {
            var list = (this.selected ? that.selectedList : that.availableList);
            var item = that._getOptionNode(this).show();
            that._applyItemState(item, this.selected);
            item.data('multiselect.idx', list.children('li').length + i - 1);
            // cache
            list.data('multiselect.cache')[item.data('multiselect.itemLink').text] = item;

            that._insertToList(item, list);
            
               
            if (this.selected) {
               var optionLink = item.data('multiselect.itemLink');
               that._trigger('selected', null, that._ui('selection', optionLink));
            };
         }));

         // update count
         that._setBusy(false);
         that._updateCount();
      }, 1);
   },
   _insertToList: function(node, list) {
      var that = this;
      this._setBusy(true);
      // the browsers don't like batch node insertion...
      var _addNodeRetry = 0;
      var _addNode = function() {
         var succ = (that.options.nodeComparator ? that._getSuccessorNode(node, list) : null);
         try 
         {
            if (succ) 
               node.insertBefore(succ);
            else 
               list.append(node);

            if (list === that.selectedList) that._moveOptionNode(node);

            // callback after node insertion
            if ('function' == typeof that.options.nodeInserted) that.options.nodeInserted(node);
               that._setBusy(false);
         } 
         catch (e) 
         {
            // if this problem did not occur too many times already
            if ( _addNodeRetry++ < 10 ) {
               // try again later (let the browser cool down first)
               setTimeout(function() { _addNode(); }, 1);
            } 
            else 
            {
               that._messages(
                  $.ui.multiselect.constants.MESSAGE_EXCEPTION,
                  $.ui.multiselect.locale.errorInsertNode,
                  {key:node.data('multiselect.itemLink').text, value:node.text()}
               );
            that._setBusy(false);
            }
         }
      };
      _addNode();
   },
   _updateCount: function() {
      var that = this;
      // defer until system is not busy
      if (this.busy) setTimeout(function() { that._updateCount(); }, 100);
      // count only visible <li> (less .ui-helper-hidden*)
      var count = this.selectedList.children('li:not(.ui-helper-hidden-accessible,.ui-sortable-placeholder):visible').size();
      var total = this.availableList.children('li:not(.ui-helper-hidden-accessible,.ui-sortable-placeholder,.shadowed)').size() + count;
      this.selectedContainer.find('span.count')
         .text(count + " " + $.ui.multiselect.locale.itemsCount)
         .attr('title', total + " " + $.ui.multiselect.locale.itemsTotal);
   },
   _getOptionNode: function(option) {     
      var node = $('<li class="ui-state-default ui-element preloaderContextMenu" title="'+ option.title +'"><span class="ui-icon"/>'+option.text+'<a href="#" class="action"><span class="ui-corner-all ui-icon"/></a></li>').hide();
      node.data('multiselect.itemLink', option);
      return node;
   },
   _moveOptionNode: function(item) {
      // call this async to let the item be placed correctly
      setTimeout( function() {
         var optionLink = item.data('multiselect.itemLink');
         if (optionLink) 
         {
            var prevItem = item.prev('li:not(.ui-helper-hidden-accessible,.ui-sortable-placeholder):visible');
            var prevOptionLink = prevItem.size() ? prevItem.data('multiselect.itemLink') : null;

            if (prevOptionLink) 
            {
               //optionLink.insertAfter(prevOptionLink);
            } 
            else 
            {
               //optionLink.prependTo(optionLink.parent());
            }
         }
      }, 100);
   },
   // used by select and deselect, etc.
   _findItem: function(text, list) {
      var found = null;
      list.children('li.ui-element:visible').each(function(i,el) {
         el = $(el);
         if (el.text().toLowerCase() === text.toLowerCase())
            found = el;
      });

      if (found && found.size()) 
      {
         return found;
      } 
      else 
      {
         return false;
      }
   },
	// clones an item with
   // didn't find a smarter away around this (michael)
   // now using cache to speed up the process (yr)
   _cloneWithData: function(clonee, cacheName, insertItem) {
      var that = this;
      var id = clonee.data('multiselect.itemLink').text;
      var selected = ('selected' == cacheName);
      var list = (selected ? this.selectedList : this.availableList);
      var clone = list.data('multiselect.cache')[id];

      if (!clone) {
         clone = clonee.clone().hide();
         this._applyItemState(clone, selected);
         // update cache
         list.data('multiselect.cache')[id] = clone;
         // update <option> and idx
         clone.data('multiselect.itemLink', clonee.data('multiselect.itemLink'));
         // need this here because idx is needed in _getSuccessorNode
         clone.data('multiselect.idx', clonee.data('multiselect.idx'));

         // insert the node into it's list
         if (insertItem)
            this._insertToList(clone, list);
      } 
      else 
      {
         // update idx
         clone.data('multiselect.idx', clonee.data('multiselect.idx'));
      }
      return clone;
   },
   _batchSelect: function(elements, state) {
      this._setBusy(true);

      var that = this;
      // do this async so the browser actually display the waiting message
      setTimeout(function() {
         var _backup = {
            speed: that.options.speed,
            hide: that.options.hide,
            show: that.options.show
         };

         that.options.speed = null;
         that.options.hide = 'hide';
         that.options.show = 'show';

         elements.each(function(i,element) {
            that._setSelected($(element), state);
         });

         // filter available items
         if (!state) that._filter(that.availableList.find('li.ui-element'));

         // restore
         $.extend(that.options, _backup);

         that._updateCount();
         that._setBusy(false);
      }, 10);
   },
	// find the best successor the given item in the specified list
   // TODO implement a faster sorting algorithm (and remove the idx dependancy)
   _getSuccessorNode: function(item, list) {
      // look for successor based on initial option index
      var items = list.find('li.ui-element'), comparator = this.options.nodeComparator;
      var itemsSize = items.size();

      // no successor, list is null
      if (items.size() == 0) return null;

      var succ, i = Math.min(item.data('multiselect.idx'),itemsSize-1), direction = comparator(item, $(items[i]));

      if ( direction ) {
         // quick checks
         if (0>direction && 0>=i) {
            succ = items[0];
         } 
         else if (0<direction && itemsSize-1<=i) {
            i++;
            succ = null;
         } 
         else 
         {
            while (i>=0 && i<items.length) {
               direction > 0 ? i++ : i--;
               if (i<0)
                  succ = item[0]

               if ( direction != comparator(item, $(items[i])) ) {
                  // going up, go back one item down, otherwise leave as is
                  succ = items[direction > 0 ? i : i+1];
                  break;
               }
            }
         }
      } 
      else 
         succ = items[i];

      // update idx
      item.data('multiselect.idx', i);

      return succ;
   },
	// @param DOMElement item is the item to set
   // @param bool selected true|false (state)
   // @param bool noclone (optional) true only if item should not be cloned on the other list
   _setSelected: function(item, selected, noclone) {
      var that = this, otherItem;
      var optionLink = item.data('multiselect.itemLink');

      if (selected) {
         // already selected
         if (optionLink.selected) return;
         optionLink.selected = true;

         if (noclone) {
            otherItem = item;
         } 
         else 
         {
            // retrieve associated or cloned item
            otherItem = this._cloneWithData(item, 'selected', true).hide();
            item.addClass('shadowed')[this.options.hide](this.options.speed, function() { that._updateCount(); }).removeClass('preloaderContextMenu');//.css('background', 'red'); // DEBUG
            //item.remove();
         }
         otherItem[this.options.show](this.options.speed).addClass('preloaderContextMenu')//.css('background', 'blue'); // DEBUG
      } 
      else 
      {
         // already deselected
         if (!optionLink.selected) return;
         optionLink.selected = false;

         if (noclone) {
            otherItem = item;
         } 
         else 
         {
            // retrieve associated or clone the item
            otherItem = this._cloneWithData(item, 'available', true).hide().removeClass('shadowed');
            item[this.options.hide](this.options.speed, function() { that._updateCount() }).removeClass('preloaderContextMenu');//.css('background', 'yellow'); // DEBUG
         }

         if (!otherItem.is('.filtered')) 
            otherItem[this.options.show](this.options.speed).addClass('preloaderContextMenu');//.css('background', 'green'); // DEBUG
      }

      if (!this.busy) {
         if (this.options.speed) {
            // pulse
            //otherItem.effect("pulsate", { times: 1, mode: 'show' }, 400); // pulsate twice???
            otherItem.fadeTo('fast', 0.3, function() { $(this).fadeTo('fast', 1); });
         }
      }

      // fire selection event
      this._trigger(selected ? 'selected' : 'deselected', null, this._ui('selection', optionLink));

      return otherItem;
   },
	_setBusy: function(state) {
      var input = this.availableActions.children('input.search');
      var busy = this.availableActions.children('.busy');

      this.busy = Math.max(state ? ++this.busy : --this.busy, 0);

      this.container.find("a.remove-all, a.add-all")[this.busy ? 'hide' : 'show']();
      if (state && (1 == this.busy)) {
         if (this.options.searchable) {
            // backup input state
            input.data('multiselect.hadFocus', input.data('multiselect.hasFocus'));
            // webkit needs to blur before hiding or it won't fire focus again in the else block
            input.blur().hide();
         }
         busy.show();
      } 
      else if(!this.busy) {
         if (this.options.searchable) {
            input.show();
            if (input.data('multiselect.hadFocus')) input.focus();
         }
         busy.hide();
      }

      // DEBUG
      //this._messages(0, "Busy state changed to : " + this.busy);
   },
	_applyItemState: function(item, selected) {
      if (selected) 
      {
         item.children('span').addClass('ui-helper-hidden').removeClass('ui-icon');
         item.find('a.action span').addClass('ui-icon-minus').removeClass('ui-icon-plus');
         this._registerRemoveEvents(item.find('a.action'));
      } 
      else 
      {
         item.children('span').addClass('ui-helper-hidden').removeClass('ui-icon');
         item.find('a.action span').addClass('ui-icon-plus').removeClass('ui-icon-minus');
         this._registerAddEvents(item.find('a.action'));
      }

      this._registerHoverEvents(item);

      return item;
	},
	// apply filter and return elements
   _filter: function(elements) {
      var input = this.availableActions.children('input.search');
      var term = $.trim( input.val().toLowerCase() );

      if ( !term ) {
         elements.removeClass('filtered');
      } 
      else 
      {
         elements.each(function(i,element) {
            element = $(element);
            element[(element.text().toLowerCase().indexOf(term)>=0 ? 'remove' : 'add')+'Class']('filtered');
         });
      }

      return elements.not('.filtered, .shadowed').show().end().filter('.filtered, .shadowed').hide().end();
   },
   _resize: function(e, ui) {
      var that = this;
		// set dimensions
      //that.container.width(that.element.width()+1);

      // DEBUG
      //console.info("===*/\\\*=== Resize ===*/\\\*===");
      //console.info("----- container -----: " + that.container.width());

      this.selectedContainer.width(Math.floor((that.container.width() * that.options.dividerLocation)));
      this.availableContainer.width(Math.floor((that.container.width() * (1 - that.options.dividerLocation) - 1)));

      //console.info("----- container -----: " + that.container.width());
      //console.info("selectedContainer: " + this.selectedContainer.width());
      //console.info("selectedContainer: " + that.container.width() * that.options.dividerLocation);
      //console.info("availableContainer: " + this.availableContainer.width());
      //console.info("availableContainer: " + that.container.width() * ( 1 - that.options.dividerLocation));

      this.selectedContainer.width(Math.floor((that.container.width() * that.options.dividerLocation)));
      this.availableContainer.width(Math.floor((that.container.width() * ( 1 - that.options.dividerLocation) - 1)));

      //console.info("----- container -----: " + that.container.width());
      //console.info("selectedContainer: " + this.selectedContainer.width());
      //console.info("selectedContainer: " + that.container.width() * that.options.dividerLocation);
      //console.info("availableContainer: " + this.availableContainer.width());
      //console.info("availableContainer: " + that.container.width() * ( 1 - that.options.dividerLocation));

      // fix list height to match <option> depending on their individual header's heights
      this.selectedList.height(Math.max(that.container.height()- that.selectedActions.height() - 2, 1));
      this.availableList.height(Math.max(that.container.height()- that.availableActions.height() - 2, 1));
   },
	_registerHoverEvents: function(elements) {
      elements
      .unbind('mouseover.multiselect').bind('mouseover.multiselect', function() {
         $(this).find('a').andSelf().addClass('ui-state-hover');
      })
      .unbind('mouseout.multiselect').bind('mouseout.multiselect', function() {
         $(this).find('a').andSelf().removeClass('ui-state-hover');
      })
      .find('a').andSelf().removeClass('ui-state-hover');
   },
	_registerAddEvents: function(elements) {
      var that = this;
      elements.unbind('click.multiselect').bind('click.multiselect', function() {
         // ignore if busy...
         if (!this.busy) {
            that._setSelected($(this).parent(), true);
         }
         return false;
      });

      if (this.availableList.data('multiselect.draggable')) {
         // make draggable
         elements.each(function() {
            $(this).parent().draggable({
               connectToSortable: that.selectedList,
               helper: _dragHelper,
               appendTo: that.container,
               containment: that.container,
               revert: 'invalid'
            });
         });
         // refresh the selected list or the draggable will not connect to it first hand
         if (this.selectedList.data('multiselect.sortable')) {
            this.selectedList.sortable('refresh');
         }
      }
   },
	_registerRemoveEvents: function(elements) {
      var that = this;
      elements.unbind('click.multiselect').bind('click.multiselect', function() {
         // ignore if busy...
         if (!that.busy) {
            that._setSelected($(this).parent(), false);
         }
         return false;
      });
      if (this.selectedList.data('multiselect.draggable')) 
      {
         // make draggable
         elements.each(function() {
            $(this).parent().draggable({
               connectToSortable: that.availableList,
               helper: _dragHelper,
               appendTo: that.container,
               containment: that.container,
               revert: 'invalid'
            });
         });

         // refresh the selected list or the draggable will not connect to it first hand
         if (this.availableList.data('multiselect.sortable')) {
            this.availableList.sortable('refresh');
         }
      }
  },
	_registerSearchEvents: function(input, searchNow) {
      var that = this;
      var previousValue = input.val(), timer;

      var _searchNow = function(forceUpdate) {
         if (that.busy) return;

         var value = input.val();
         if ((value != previousValue) || (forceUpdate)) {
            that._setBusy(true);

            if (that.options.remoteUrl) {
               var params = $.extend({}, that.options.remoteParams);
               try 
               {
                  $.ajax({
                     url: that.options.remoteUrl,
                     data: $.extend(params, {q:escape(value)}),
                     success: function(data) {
                        that.addItem(data);
                        that._setBusy(false);
                     },
                     error: function(request,status,e) {
                        that._messages(
                           $.ui.multiselect.constants.MESSAGE_ERROR,
                           $.ui.multiselect.locale.errorRequest,
                           {status:status}
                        );
                        that._setBusy(false);
                     }
                  });
               } 
               catch (e) 
               {
                  that._messages($.ui.multiselect.constants.MESSAGE_EXCEPTION, e.message); // error message template ??
                  that._setBusy(false);
               }
            } 
            else 
            {
               that._filter(that.availableList.children('li.ui-element'));
               that._setBusy(false);
            }

            previousValue = value;
         }
      };

      // reset any events... if any
      input.unbind('focus.multiselect blur.multiselect keydown.multiselect keypress.multiselect');
      if (this.options.searchable) {
         input
         .bind('focus.multiselect', function() {
            $(this).addClass('ui-state-active').data('multiselect.hasFocus', true);
         })
         .bind('blur.multiselect', function() {
            $(this).removeClass('ui-state-active').data('multiselect.hasFocus', false);
         })
         .bind('keydown.multiselect keypress.multiselect', function(e) {
            if (timer) clearTimeout(timer);
            switch (e.which) 
            {
               case 13: // enter
                  _searchNow(true);
                  return false;

               default:
                  timer = setTimeout(function() { _searchNow(); }, Math.max(that.options.searchDelay,1));
            }
         })
         .show();
      } 
      else 
      {
         input.val('').hide();
         this._filter(that.availableList.find('li.ui-element'))
      }
      // initiate search filter (delayed)
      var _initSearch = function() {
         if (that.busy) {
            setTimeout(function() { _initSearch(); }, 100);
         }
         _searchNow(true);
      };

      if (searchNow) _initSearch();
   }
});

var _dragHelper = function(event, ui) {
   var item = $(event.target);
   var clone = item.clone().width(item.width());
   clone
      .data('multiselect.itemLink', item.data('multiselect.itemLink'))
      .data('multiselect.list', item.parent() )
      // node ui cleanup
      .find('a').remove();
   return clone;
};
		
$.extend($.ui.multiselect, {
   getter: 'selectedValues enabled isBusy',
   locale: {
      addAll:'Add all',
      removeAll:'Remove all',
      itemsCount:'items selected',
      itemsTotal:'items total',
      busy:'please wait...',
      errorDataFormat:"Cannot add options, unknown data format",
      errorInsertNode:"There was a problem trying to add the item:\n\n\t[#{key}] => #{value}\n\nThe operation was aborted.",
      errorReadonly:"The option #{option} is readonly",
      errorRequest:"Sorry! There seemed to be a problem with the remote call. (Type: #{status})"
   },
   constants: {
      MESSAGE_WARNING: 0,
      MESSAGE_EXCEPTION: 1,
      MESSAGE_ERROR: 2
   }
});


})(jQuery);
