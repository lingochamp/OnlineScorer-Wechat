const gulp = require('gulp');
const babel = require('gulp-babel');
const browserify = require('gulp-browserify');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const runSequence = require('run-sequence');

const version = '1.1.1';

gulp.task('browserify', () => {
  return gulp.src(`lib/index.js`)
    .pipe(browserify({
      standalone: 'llsWxRecorder'
    }))
    .pipe(uglify())
    .pipe(rename({
      basename: 'llsWxRecorder',
      suffix: `-v${version}`
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', () => {
  return gulp.src('./src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./lib'));
});

gulp.task('default', cb => {
  runSequence(`build`, `browserify`, cb);
});
