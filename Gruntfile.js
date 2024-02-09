
var coreFiles = [
    "src/js/EventManager.js",
    "src/js/gisportal.js",
    "src/js/loading.js",
    "src/js/templates.js",
    "src/js/portal.js",
    "src/js/share.js",
    "src/js/panels.js",
    "src/js/panel-slideout.js",
    "src/js/ui.js",
    "src/js/configure.js",
    "src/js/scalebar.js",
    "src/js/refine.js",
    "src/js/indicators.js",
    "src/js/selectiontools.js",
    "src/js/notify.js",
    "src/js/notify_settings.js",
    "src/js/vector_styles.js",
    "src/js/layer.js",
    "src/js/vector_layer.js",
    "src/js/timeline.js",
    "src/js/Plot.js",
    "src/js/PlotEditor.js",
    "src/js/PlotStatus.js",
    "src/js/graphing.js",
    "src/js/utils.js",
    "src/js/map-settings.js",
    "src/js/analytics.js",
    "src/js/user_feedback.js",
    "src/js/ddslick.js",
    "src/js/autoLayer.js",
    "src/js/addLayersForm.js",
    "src/js/editLayersForm.js",
    "src/js/editgroups.js",
    "src/js/geolocationFilter.js",
    "src/js/view.js",
    "src/js/user.js",
    "src/js/collaboration.js",
    "src/js/collaboration-event-bindings.js",
    "src/js/walkthrough-event-bindings.js",
    "src/js/webrtc_control.js",
    "src/js/walkthrough.js",
    "src/js/API.js",
    "src/js/comparison.js",
    "src/js/projectSpecific.js",
    "src/js/depthBar.js"
  ];

function stripDirectory( file ) {
   return file.replace( /.+\/(.+?)>?$/, "$1" );
}

module.exports = function(grunt) {

   // Project configuration.
   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      sass: {
         all: {
            options : {
               style: 'expanded'
            },
            files: {
               'html/css/<%= pkg.name %>.css' : 'src/css/scss/gisportal.scss',
               'html/css/login.css' : 'src/css/scss/login.scss',
	 	         'html/css/<%= pkg.name %>-marine-eo.css' : 'src/css/scss/gisportal-marine-eo.scss',
               'html/css/<%= pkg.name %>_blue.css' : 'src/css/scss/gisportal_blue.scss',
               'html/css/<%= pkg.name %>_modellers.css' : 'src/css/scss/gisportal_modellers.scss',
               'html/css/<%= pkg.name %>_petrel.css' : 'src/css/scss/gisportal_petrel.scss'
            }
         }
      },
      concat: {      
         javascript: {
            options: {
               stripBanners: true
            },
            src: coreFiles,
            dest: 'html/<%= pkg.name %>.js',
            nonull: true
         },
         javascriptLogin: {
            options: {
               stripBanners: true
            },
            src: [ 'src/js/login.js' ],
            dest: 'html/login.js',
            nonull: true
         },
         templates: {
            options: {
               process: function(src, filepath) {
                  return '#####' + stripDirectory(filepath) + '###' + src;
               }
            },
            src: 'src/templates/*.mst',
            dest: 'html/all_templates.mst'
         }
      },
   
      uglify: {
         options: {
            compress: {
               drop_console: true,
               drop_debugger: true,
               dead_code: true,
               warnings: true
            }
         },
         build: {
            files: {
               'html/<%= pkg.name %>.min.js': 'html/<%= pkg.name %>.js',
            }
         }
      },
      postcss: {
         options: {
            processors: [
               require('pixrem')(),
               require('autoprefixer')({browsers: 'last 2 versions'}), // add vendor prefixes
            ]
         },
         dist: {
            src: 'html/css/<%= pkg.name %>.css',
         }
      },
      cssmin: {
         options: {
            shorthandCompacting: false,
            roundingPrecision: -1
         },
         target: {
            files: {
              'html/css/<%= pkg.name %>.min.css': 'html/css/<%= pkg.name %>.css',
              'html/css/<%= pkg.name %>-marine-eo.min.css' : 'html/css/<%= pkg.name %>-marine-eo.css',
              'html/css/<%= pkg.name %>_blue.min.css': 'html/css/<%= pkg.name %>_blue.css',
              'html/css/<%= pkg.name %>_modellers.min.css': 'html/css/<%= pkg.name %>_modellers.css',
              'html/css/<%= pkg.name %>_petrel.min.css': 'html/css/<%= pkg.name %>_petrel.css'
            }
         }
      },
      replace: {
         dev: {
            options: {
               patterns: [
                  {
                     match: 'GISportal.min.',
                     replacement: 'GISportal.'
                  },
                  {
                     match: 'MODE',
                     replacement: 'dev'
                  }
               ]
            },
            files: [
               {expand: true, flatten: true, src: ['src/index.html'], dest: 'html/application/'}
            ]
         },
         build: {
            options: {
               patterns: [
                  {
                     match: 'GISportal.min.',
                     replacement: 'GISportal.min.'
                  },
                  {
                     match: 'MODE',
                     replacement: 'production'
                  }
               ]
            },
            files: [
               {expand: true, flatten: true, src: ['src/index.html'], dest: 'html/application/'}
            ]
         }
      },
      jshint: {
         all: coreFiles
      }
      
   });

   // Load the plugin that provides the 'uglify' task.
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-postcss');
   grunt.loadNpmTasks('grunt-contrib-cssmin');  // this is here because cssnano that's a plugin for postcss is too slow
   grunt.loadNpmTasks('grunt-contrib-jshint');
   grunt.loadNpmTasks('grunt-replace');
   grunt.loadNpmTasks('grunt-contrib-sass');
   

   // Tasks
   grunt.registerTask('default', ['sass', 'concat', 'uglify', 'postcss', 'cssmin', 'replace:build']);
   grunt.registerTask('dev', ['sass','concat','replace:dev', 'jshint']);

};
