
var coreFiles = [
    "src/js/EventManager.js",
    "config/config.js",
    "src/js/gisportal.js",
    "src/js/loading.js",
    "src/js/templates.js",
    "src/js/portal.js",
    "src/js/panels.js",
    "src/js/panel-slideout.js",
    "src/js/ui.js",
    "config/analytics_config.js",
    "src/js/configure.js",
    "src/js/scalebar.js",
    "src/js/refine.js",
    "src/js/indicators.js",
    "src/js/selectiontools.js",
    "src/libs/jquery-gritter/jquery.gritter.js",
    "src/js/gritter.js",
    "src/js/layer.js",
    "src/js/openid.js",
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
    "src/js/autoLayer.js"
  ];

var cssFiles = [
    "src/css/reset.css",
    "src/css/fonts.css",
    "src/css/streamline.css",
    "src/css/streamline-filled-in.css",
    "src/css/type.css",
    "src/css/overlay.css",
    "src/css/start.css",
    "src/css/export.css",
    "src/css/share.css",
    "src/css/animation.css",
    "src/css/jquery.nouislider.css",
    "html/js-libs/jquery-gritter/css/jquery.gritter.css",
    "src/css/timeline.css",
    "src/css/main.css",
    "src/css/grid.css",
    "src/css/icons.css",
    "src/css/panel.css",
    "src/css/panel-slideout.css",
    "src/css/metadata-panel.css",
    "src/css/scalebar.css",
    "src/css/indicators.css",
    "src/css/tables.css",
    "src/css/graph.css",
    "src/css/nv.d3.css",
    "src/css/history.css",
    "src/css/mapcontrols.css",
    "html/js-libs/tooltipster/css/tooltipster.css",
    "html/js-libs/tooltipster/css/themes/tooltipster-shadow.css",
    "src/css/alerts.css",
    "src/css/popup.css"
  ]

function stripDirectory( file ) {
   return file.replace( /.+\/(.+?)>?$/, "$1" );
}

module.exports = function(grunt) {

   // Project configuration.
   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      concat: {      
         styles: {
            options: {
               stripBanners: true
            },
            src: cssFiles,
            dest: 'html/css/<%= pkg.name %>.css',
            nonull: true
         },
         javascript: {
            options: {
               stripBanners: true
            },
            src: coreFiles,
            dest: 'html/<%= pkg.name %>.js',
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
      cssmin: {
         options: {
            shorthandCompacting: false,
            roundingPrecision: -1
         },
         target: {
            files: {
              'html/css/<%= pkg.name %>.min.css': 'html/css/<%= pkg.name %>.css'
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
                  }
               ]
            },
            files: [
               {expand: true, flatten: true, src: ['src/index.html'], dest: 'html/'}
            ]
         },
         build: {
            options: {
               patterns: [
                  {
                     match: 'GISportal.min.',
                     replacement: 'GISportal.min.'
                  }
               ]
            },
            files: [
               {expand: true, flatten: true, src: ['src/index.html'], dest: 'html/'}
            ]
         }
      }
      
   });

   // Load the plugin that provides the 'uglify' task.
   grunt.loadNpmTasks('grunt-contrib-concat');
   grunt.loadNpmTasks('grunt-contrib-uglify');
   grunt.loadNpmTasks('grunt-contrib-cssmin');
   grunt.loadNpmTasks('grunt-replace');
   

   // Tasks
   grunt.registerTask('default', ['concat', 'uglify', 'cssmin', 'replace:build']);
   grunt.registerTask('dev', ['concat', 'uglify', 'cssmin', 'replace:dev']);

};