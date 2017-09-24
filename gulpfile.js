const gulp = require('gulp');
const sass = require('gulp-sass');
const autoPrefixer = require('gulp-autoprefixer');
const minifyCSS = require('gulp-minify-css');
const browserify = require('gulp-browserify');
const concat = require('gulp-concat');
const copy = require('gulp-copy');
const jade = require('gulp-jade');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const webserver = require('gulp-webserver');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');

gulp.task('sass', () => {
  gulp
    .src('src/sass/*.scss')
    .pipe(sass())
    .on('error', function (error) {
      console.log(error);
      this.emit('end');
    })
    .pipe(autoPrefixer())
    .pipe(minifyCSS())
    .pipe(gulp.dest('build/css'));
});
gulp.task('templates', () => {
  gulp
    .src('src/jade/**/*.jade')
    .pipe(jade({}))
    .on('error', function (error) {
      console.log(error);
      this.emit('end');
    })
    .pipe(gulp.dest('./build'));
});
gulp.task('images', () =>
  gulp
    .src('./src/images/**/*')
    .pipe(
      cache(
        imagemin({
          optimizationLevel: 3,
          progressive: true,
          interlaced: true,
        }),
      ),
    )
    .pipe(gulp.dest('./build/img')),
);
gulp.task('browserify', () => {
  gulp
    .src(['src/javascripts/main.js'])
    .pipe(
      browserify({
        insertGlobals: true,
        debug: true,
      }),
    )
    .on('error', function (error) {
      console.log(error);
      this.emit('end');
    })
    .pipe(concat('app.js'))
    .pipe(gulp.dest('build/js'));
});

gulp.task('bundle-libs', () =>
  gulp
    .src('src/javascripts/o3djs/*.js')
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('build/js')),
);

gulp.task('insert-bin', () =>
  gulp.src('src/bin/**').pipe(
    copy('build/bin', {
      prefix: 2,
    }),
  ),
);

gulp.task('iconfont', () => {
  gulp
    .src(['src/icons/*.svg'])
    .pipe(
      iconfontCss({
        fontName: 'icons',
        path: 'src/assets/templates/_icons.scss',
        targetPath: '../../../../src/sass/fonts/_icons.scss',
        fontPath: '../bin/fonts/icons/',
      }),
    )
    .pipe(
      iconfont({
        fontName: 'icons',
        normalize: true,
      }),
    )
    .pipe(gulp.dest('build/bin/fonts/icons/'));
});

gulp.task('webserver', () => {
  gulp.src('./build').pipe(
    webserver({
      livereload: true,
      open: true,
      fallback: 'index.html',
    }),
  );
});
gulp.task('watch', () => {
  gulp.watch('src/icons/**/*.svg', ['iconfont']);
  gulp.watch('src/assets/**/*', ['iconfont']);
  gulp.watch('src/sass/**/*', ['sass']);
  gulp.watch('src/jade/**/*.jade', ['templates']);
  gulp.watch('src/javascripts/**', ['browserify']);
  gulp.watch('src/javascripts/lib/**', ['bundle-libs']);
  gulp.watch('src/images/**', ['images']);
  gulp.watch('src/bin/**', ['insert-bin']);
});
gulp.task('build-all', [
  'iconfont',
  'sass',
  'templates',
  'browserify',
  'bundle-libs',
  'images',
  'insert-bin',
]);
gulp.task('default', ['watch', 'webserver']);
