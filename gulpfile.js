"use strict"

const gulp = require("gulp"),
      concat = require("gulp-concat"),
      rename = require("gulp-rename"),
      csso = require("gulp-csso"),
      autoprefixer = require("gulp-autoprefixer"),
      sass = require("gulp-sass"),
      useref = require("gulp-useref"),
      gulpif = require("gulp-if"),
      uglify = require("gulp-uglify"),
      clean = require("gulp-clean"),
      gulpSequence = require("gulp-sequence"),
      csscomb = require("gulp-csscomb"),
      browserSync = require("browser-sync").create(),
      sftp = require("gulp-sftp"),
      spritesmith = require("gulp.spritesmith"),
      imagemin = require("gulp-imagemin"),
      pngquant = require("imagemin-pngquant"),
      jade = require("gulp-jade"),
      htmlreplace = require("gulp-html-replace"),
      postcss = require("gulp-postcss"),
      cssnext = require("postcss-cssnext"),
      svgo = require("postcss-svgo"),
      inlineSVG = require("postcss-inline-svg"),
      purify = require("gulp-purifycss");

// Наблюдатель за изменениями в scss и html
gulp.task("start-watch", ["serve"]);

gulp.task("serve", ["sass"], function() {

    browserSync.init({
        server: "./src"
    });

    gulp.watch("src/**/*.scss", ["sass"]);
    gulp.watch("src/**/*.jade", ["jade"]);
    gulp.watch("src/scss/includes/svg-background.css", ["svg-background"]);
    gulp.watch("src/*.html").on("change", browserSync.reload);
});

gulp.task("sass", function() {
    return gulp.src("src/scss/main.scss")
        .pipe(sass())
        .pipe(autoprefixer({ browsers: ["last 2 versions", "> 1%", "IE 7"]}))
        .pipe(csscomb())
        .pipe(purify(["src/js/*.js", "src/*.html"]))
        .pipe(gulp.dest("src/css"))
        .pipe(browserSync.stream());
});

gulp.task("jade", function () {
  return gulp.src("src/**/*.jade")
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest("src/"))
});

// Импорт свг картинок в стили
gulp.task("svg-background", function() {
  return gulp.src("./src/scss/includes/svg-background.css")
    .pipe(postcss([
      cssnext,
      inlineSVG,
      svgo,
    ]))
    .pipe(gulp.dest("./src/scss/"));
});

gulp.task("clean", function () {
    return gulp.src("build/", {read: false})
        .pipe(clean());
});

// Перенос папки font в билд
gulp.task("take-font", function() {
  return gulp.src("src/font/*")
    .pipe(gulp.dest("build/font/"))
});

// Сшить png в спрайт
gulp.task("sprite-png", function () {
  var spriteData = gulp.src("src/images/sprite/*.png").pipe(spritesmith({
    imgName: "sprite.png",
    cssName: "sprite.css"
  }))
  .pipe(clean())
  return spriteData.pipe(gulp.dest("src/images/"));
});

// Оптимизировать изображения
gulp.task("img-optimize", () => {
  return gulp.src("src/images/*.{jpg,jpeg,gif,png,svg}")
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(gulp.dest("build/images/"));
});

// Зашить js в один, минифицировать и переименовать в main.min.js
gulp.task("concat-js", function() {
  return gulp.src("./src/js/*.js")
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("./build/js"));
});

// Минифицировать css и переименовать в main.min.css
gulp.task("min-css", function() {
  return gulp.src("./src/css/main.css")
    .pipe(csso())
    .pipe(rename("main.min.css"))
    .pipe(gulp.dest("./build/css"));
});

// Переписать пути css и js в html
gulp.task("html-replace", function() {
  return gulp.src("./src/*.html")
    .pipe(htmlreplace({
        "css": "css/main.min.css",
        "js": "js/main.min.js"
    }))
    .pipe(gulp.dest("build/"));
});

// Сжать и минифицировать css и js. Переписать пути в html
gulp.task("concat-and-minify-js-css", function (cb) {
  gulpSequence("concat-js", "min-css", "html-replace", cb);
});

// Сборка билда: очистка папки, минификация css и js в один файл, оптимизация картинок, перемещение папки со шрифтами
gulp.task("build", function (cb) {
  gulpSequence("clean", "concat-and-minify-js-css", "img-optimize", "take-font", cb);
});

// Отправка билда на сервер
gulp.task("send-ftp", function () {
  return gulp.src("build/*")
    .pipe(sftp({
      host: "website.com",
      user: "johndoe",
      pass: "1234",
      remotePath:"/"
    }));
});
