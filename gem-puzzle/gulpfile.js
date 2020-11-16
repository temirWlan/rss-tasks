"use strict";

const gulp = require("gulp");
const webpack = require("webpack-stream");
const browsersync = require("browser-sync");
const htmlmin = require("gulp-htmlmin");
const autoprefixer = require("gulp-autoprefixer");
const concat = require("gulp-concat");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const cleanCSS = require("gulp-clean-css");
const sourcemaps   = require("gulp-sourcemaps");
const imagemin = require("gulp-imagemin");
const del          = require("del");

const build = "./build/";

// clean build
gulp.task("clean", () => {
    return del(build);
});

// copy html
gulp.task("copy-html", () => {
    return gulp.src("./app/index.html")
                .pipe(htmlmin({ collapseWhitespace: true }))
                .pipe(gulp.dest(build))
                .pipe(browsersync.stream());
});

// copy css
// gulp.task("copy-css", () => {
//     return gulp.src("./app/assets/css/**/*.css")
//                 .pipe(sourcemaps.init())
//                 .pipe(cleanCSS({compatibility: 'ie8'}))
//                 .pipe(sourcemaps.write("./"))
//                 .pipe(gulp.dest(build + "assets/css"))
//                 .on("end", browsersync.reload);
// });

// dev javascript
gulp.task("build-js", () => {
    return gulp.src("./app/assets/js/main.js")
                .pipe(webpack({
                    mode: "development",
                    output: {
                        filename: "script.js"
                    },
                    watch: false,
                    devtool: "source-map",
                    module: {
                        rules: [
                          {
                            test: /\.m?js$/,
                            exclude: /(node_modules|bower_components)/,
                            use: {
                              loader: "babel-loader",
                              options: {
                                presets: [["@babel/preset-env", {
                                    debug: true,
                                    corejs: 3,
                                    useBuiltIns: "usage"
                                }]]
                              }
                            }
                          }
                        ]
                      }
                }))
                .pipe(gulp.dest(build + "assets/js"))
                .on("end", browsersync.reload);
});

// styles
gulp.task("styles", () => {
    return gulp.src("./app/assets/sass/**/style.sass")
    .pipe(sourcemaps.init())                                                                
    .pipe(concat("main.sass"))                                                              
    .pipe(sass({outputStyle: "compressed"}).on("error", sass.logError))     
    .pipe(autoprefixer({                                                                       
        overrideBrowserslist: ["last 8 versions"],                              
        cascade: false
    }))
    .pipe(rename({suffix: ".min"}))                                                     
    .pipe(sourcemaps.write("./"))                                                           
    .pipe(gulp.dest(build + "assets/css"))                                                    
    .on("end", browsersync.reload);                                                      
});

// images
gulp.task("copy-img", () => {
    return gulp.src("./app/assets/img/**/*.*")
                .pipe(imagemin([
                    imagemin.gifsicle({interlaced: true}),
                    imagemin.mozjpeg({
                        progressive: true,
                        max: 80,
                        min: 70
                    }),
                    imagemin.optipng({quality: '80', optimizationLevel: 5}),
                    imagemin.svgo({plugins: [{removeViewBox: true}]})
                ]))
                .pipe(gulp.dest(build + 'assets/img'))
                .on("end", browsersync.reload);
});


// fonts
gulp.task("copy-fonts", () => {
    return gulp.src("./app/assets/fonts/**/*.*")
                .pipe(gulp.dest(build + 'assets/fonts'))
                .on("end", browsersync.reload);
});

gulp.task("copy-sounds", () => {
    return gulp.src("./app/assets/sounds/**/*.*")
                .pipe(gulp.dest(build + "assets/sounds"))
                .on("end", browsersync.reload);
});

gulp.task("watch", () => {
    browsersync.init({
		server: "./build",
		port: 5000,
		notify: true
    });

    gulp.watch("./app/index.html", gulp.parallel("copy-html"));
    gulp.watch("./app/assets/sass/**/*.sass", gulp.parallel("styles"));
    gulp.watch("./app/assets/img/**/*.*", gulp.parallel("copy-img"));
    gulp.watch("./app/assets/fonts/**/*.*", gulp.parallel("copy-fonts"));
    gulp.watch("./app/assets/sounds/**/*.*", gulp.parallel("copy-sounds"));
    gulp.watch("./app/assets/js/**/*.js", gulp.parallel("build-js"));
});

gulp.task("build", gulp.series("clean", gulp.parallel("copy-html",
         "styles", "copy-img", "copy-sounds", "copy-fonts", "build-js")));

gulp.task("build-prod-js", () => {
    return gulp.src("./src/js/main.js")
                .pipe(webpack({
                    mode: "production",
                    output: {
                        filename: "script.js"
                    },
                    module: {
                        rules: [
                          {
                            test: /\.m?js$/,
                            exclude: /(node_modules|bower_components)/,
                            use: {
                              loader: "babel-loader",
                              options: {
                                presets: [["@babel/preset-env", {
                                    corejs: 3,
                                    useBuiltIns: "usage"
                                }]]
                              }
                            }
                          }
                        ]
                      }
                }))
                .pipe(gulp.dest(build));
});

gulp.task("default", gulp.parallel("watch", "build"));