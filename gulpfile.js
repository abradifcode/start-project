'use strict'

const gulp = require('gulp'),
      concat = require('gulp-concat'),
      rename = require('gulp-rename'),
      csso = require('gulp-csso'),
      autoprefixer = require('gulp-autoprefixer'),
      sass = require('gulp-sass'),
      uncss = require('gulp-uncss'),
      rev = require('gulp-rev-append'),
      wiredep = require('wiredep').stream,
      useref = require('gulp-useref'),
      gulpif = require('gulp-if'),
      uglify = require('gulp-uglify'),
      clean = require('gulp-clean'),
      gulpSequence = require('gulp-sequence'),
      csscomb = require('gulp-csscomb'),
      browserSync = require('browser-sync').create(),
      sftp = require('gulp-sftp'),
      mainBowerFiles = require('main-bower-files'),
      spritesmith = require('gulp.spritesmith'),
      imagemin = require('gulp-imagemin'),
      pngquant = require('imagemin-pngquant');

// Наблюдатель за изменениями в scss и html
gulp.task('start-watch', ['serve']);

gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./dev"
    });

    gulp.watch("dev/scss/*.scss", ['sass']);
    gulp.watch("dev/*.html").on('change', browserSync.reload);
});

gulp.task('sass', function() {
    return gulp.src("dev/scss/style.scss")
        .pipe(sass())
        .pipe(autoprefixer({ browsers: ['last 2 versions', '> 1%', 'IE 7']}))
        .pipe(csscomb())
        .pipe(uncss({html: ['dev/*.html']}))
        .pipe(gulp.dest("dev/css"))
        .pipe(browserSync.stream());
});

// Объединяет и минифицирует css и js в html
gulp.task('html', function () {
    return gulp.src('dev/*.html')
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', csso()))
        .pipe(gulp.dest('build/'));
});

gulp.task('clean', function () {
    return gulp.src('build/', {read: false})
        .pipe(clean());
});

gulp.task('main-js', function() {
    return gulp.src(mainBowerFiles('**/*.js'))
        .pipe(gulp.dest('dev/vendors/js'))
});

gulp.task('main-css', function() {
    return gulp.src(mainBowerFiles('**/*.css'))
        .pipe(gulp.dest('dev/vendors/css'))
});

// Переносит файлы из bower в dev каталог
gulp.task('mainfiles', function (cb) {
  gulpSequence('main-css', 'main-js', cb);
});

// Синхронизирует пути бовера с html
gulp.task('bower', function () {
  gulp.src('./dev/*.html')
    .pipe(wiredep({
      directory : 'bower_components/'
    }))
    .pipe(gulp.dest('./dev/'));
});

// Сшить png в спрайт
gulp.task('sprite-png', function () {
  var spriteData = gulp.src('dev/images/sprite/*.png').pipe(spritesmith({
    retinaSrcFilter: ['dev/images/sprite/*@2x.png'],
    imgName: 'sprite.png',
    retinaImgName: 'sprite@2x.png',
    cssName: 'sprite.css'
  }))
  .pipe(clean())
  return spriteData.pipe(gulp.dest('dev/images/sprite/'));
});

// Оптимизировать изображения
gulp.task('img-optimize', () => {
  return gulp.src('dev/images/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest('build/images'));
});

// Build
gulp.task('build', function (cb) {
  gulpSequence('clean', 'html', 'img-optimize', cb);
});

// Отправка билда на сервер
gulp.task('send-ftp', function () {
  return gulp.src('build/*')
    .pipe(sftp({
      host: 'website.com',
      user: 'johndoe',
      pass: '1234',
      remotePath:'/'
    }));
});
