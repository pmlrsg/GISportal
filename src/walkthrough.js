opec.Walkthrough = function() {
   var self = this;
   // Each chapter has its own array of steps
   this.chapters = [
   	{
   		'id' : 'portal-introduction',
   		'name' : 'An introduction to the portal',
   		'steps' : [
		      {
		         id : 0,
		         next : 1,
		         content: '<p>Welcome to the OPEC Data Portal.</p><p>This is a prototype version of the OPEC (Operational Ecology) Marine Ecosystem Forecasting portal and is a work in progress. If you find any bugs or wish to provide feedback if would gratefully received at opec@pml.ac.uk.</p>',
		         classes: 'opec-wt-intro'
		      },
		      {
		         id : 1,
		         prev : 0,
		         next : 2,
		         content: '<p>Step 1. Select a layer(s) of interest. In this worked example 02 has been selected.</p>',
		         binding: '[aria-describedby="opec-layerSelection"]',
		         commands: [
		         	"setTimeout(function() { $('[data-id=O2] a').click() }, 500);"
		        	]
		      },
		      {
		         id : 2,
		         prev : 1,
		         next : 3,
		         content: '<p>Step 2. In this panel you can see the layer you have chosen. The checked layer(s) will appear on the map once you have selected a date. You can uncheck a variable to hide it. So now it\'s time to select a date</p>',
		         binding: '.lPanel'
		      },
		      {
		         id : 3,
		         prev : 2,
		         next : 4,
		         content: '<p>Step 3. In order for the data to be presented  on the map, a date must be selected. Available data is indicated by the black boxes.</p>',
		         binding: '#topToolbar',
		         commands: [ 
		         	"$('#viewDate').datepicker( 'show' );",
		         	"setTimeout(function() { $('.ui-datepicker-days-cell-over[data-month=11][data-year=2003] a').click(); }, 500);"
		         ]
		      },
		      {
		         id : 4,
		         prev : 3,
		         next : 5,
		         content: '<p>Step 4. Now that a date has been selected data for 02 in the English Channel immediately appears on the map. You are able to zoom on the map or go to a specific region.</p>',
		         binding: '#topToolbar',
		         commands: [
		         	"$('#quickRegion')[0].selectedIndex = 7;",
		         	"setTimeout(function() { $('#quickRegion').change(); }, 500)"
		        	]
		      },
		      {
		         id : 5,
		         prev : 4,
		         next : 6,
		         content: '<p>Step 5. If you would like to view the data over time, please move over to the data analysis panel (on the right) where you can select a date range and generate graphs of the dataset in which you are interested.</p>',
		      	commands: [ "opec.rightPanel.show(); "]
		      },
		      {
		         id : 6,
		         prev : 5,
		         content: '<p>Step 6. Use the timeline at the bottom to quickly see the dates for which there is data available.</p><p>See \'Overview of the timeline\' for help on how to use it. This guide is now complete, please click on the X at the top right of the box to finish.</p>',
		         //binding: '#timeline'
		      }
   		]
   	},
   	{
   		'id' : 'timeline-overview',
   		'name' : 'An overview of the timeline',
   		'steps' : [
		      {
		         id : 0,
		         next: 1,
		         content: '<p>Step 1. At the bottom of the screen is the timeline, this is the main way of dealing with time on the portal.</p>',
		         //binding: '#timeline'
		      },
		      {
		         id : 1,
		         next: 2,
		         prev: 0,
		         content: '<p>Step 2. The timeline grows as you select layers, for temporal data it shows each item as a line.</p>',
		         //binding: '#timeline'
		      },
		      {
		         id : 2,
		         next: 3,
		         prev: 1,
		         content: '<p>Step 3. You can change the timescale by zooming in or out using a scrollwheel or similar.</p>',
		         //binding: '#timeline',
		         commands: [
		         	"opec.timeline.zoomDate(\"01/01/2000\", \"01/01/2003\");",
		         	"opec.timeline.redraw();"
		         ]
		      },
		      {
		         id : 3,
		         next: 4,
		         prev: 2,
		         content: '<p>Step 4. Data ranges can be created within the data analysis panel. Once created (by pressing "New Range") a new bar will appear in the timeline.</p>',
		         //binding: '.rPanel',
		         commands: [ 
		         	"opec.rightPanel.open();",
						"$('#advanced-inputs-header').click();", 
		         	"opec.timeline.addRangeBar('Range bar covering 2001');",
		         	"opec.rightPanel.updateRanges('Range bar covering 2001');" ,
		         	"opec.timeline.redraw();"
		         ]
		      },
		      {
		         id : 4,
		         prev: 3,		 
		         next: 5,        
		         content: '<p>Step 5. To select a range, you can click the bar <span class="bold">once</span> to choose the start of your range and then click a <span class="bold">second</span> time to choose the end date. To select more precise dates, you can use the row underneath where you created the range in the data analysis panel.</p>',
		         //binding: '#timeline',
		         commands: [
		         	"opec.timeline.rangebars[0].selectedStart = \"01/01/2001\";",
		         	"opec.timeline.rangebars[0].selectedEnd = \"01/01/2002\";",
		         	"opec.timeline.redraw();"
		         ]
		      },
		      {
		         id : 5,
		         prev: 4,		         
		         content: '<p>Step 6. To create a graph, you can open the data analysis panel and select an area of the map. Then, providing a layer is selected, you can click generate graph then name the graph (for future reference) and wait until the graph has been created. If a lot of data is being processed, this can take some time.</p>',
		         //binding: '.rPanel',
		         commands: [
		         	"$('#graphcreator-bbox').val('-4.6896,46.91016,5.01133,55.44653');",
		         	"$('#graphcreator-bbox').change();",
		         	"$('#graphcreator-generate input[type=button]').click();"
		         ]
		      }
   		]
   	}
   ];
    
   // Steps (content), DOM element, template
   $('#walkthrough').walkthrough(this.chapters[0], 
      { 
         'dom' : $('#walkthrough'), 
         'template' : opec.templates.walkthrough,
         'next' : null,
         'prev' : null
      }
   );

   $(document).ready(function() {   
       $('#walkthrough').walkthroughReposition();
   });
   
   this.currentStep = function()  {
      return $('#walkthrough').walkthroughCurrentStep();
   };
   
   $('#walkthrough-menu').on('click', 'a', function(e)  {
		e.preventDefault();
		var name = this.hash.substr(1);
		var chapter = self.chapters.filter(function(i) { return i.id === name; })[0];
		$('#walkthrough').walkthrough(chapter, { 
         'dom' : $('#walkthrough'), 
         'template' : opec.templates.walkthrough,
         'next' : null,
         'prev' : null,
         'ignore_cookies' : true
      });
   });
   
   $.each(this.chapters, function(i, chapter) {
   	$('#walkthrough-menu ul').append(opec.templates.walkthroughMenu(chapter));
   });
};
