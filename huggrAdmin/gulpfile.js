var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-continuous-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var watch = require('gulp-watch');



var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass', 'merge', 'watch']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch('./www/js/controllers/*.Ctrl.js', ['merge']);
  gulp.watch('./www/js/factories/*.js', ['merge']);
});

gulp.task('merge', function() {
  gulp.src(['./www/js/controllers/_index.js','./www/js/factories/*.js','./www/js/**/*Ctrl.js','./www/js/controllers/_last.js'])
    .pipe(watch('./www/js/**/*Ctrl.js'))
    .pipe(watch('./www/js/factories/*.js'))
    .pipe(concat('controllers.js'))
    .pipe(gulp.dest('./www/js/'));
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
