module.exports = function(grunt) {
  var jsFiles = [
    'static/components/extended/extended.js',
    'static/bower_components/cryptojslib/rollups/md5.js',
    'static/bower_components/jquery/dist/jquery.min.js',
    'static/bower_components/velocity/velocity.min.js',
    'static/bower_components/angular/angular.min.js',
    'static/bower_components/angular-resource/angular-resource.min.js',
    'static/bower_components/angular-animate/angular-animate.min.js',
    'static/bower_components/angular-loading-bar/build/loading-bar.min.js',
    'static/bower_components/angular-ui-router/release/angular-ui-router.min.js',
    'static/components/k-tap/k-tap.js',
    'static/components/k-drag/k-drag.js',
    'static/components/k-scroll/k-scroll.js',
    'static/components/k-player/k-player.js',
    'static/js/**/*.js'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: jsFiles,
        dest: 'static/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: jsFiles,
        dest: 'static/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: jsFiles,
      tasks: 'default'
    }
  });

  // 加载包含 "uglify" 任务的插件。
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // 默认被执行的任务列表。
  grunt.registerTask('default', ['concat']);
  grunt.registerTask('production', ['uglify']);
};