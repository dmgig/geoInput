console.log('Node version: ' + process.version);

var gulp   = require('gulp');
var concat = require('gulp-concat'); 
var gulpUt = require('gulp-util');
var rename = require('gulp-rename');  
var uglify = require('gulp-uglify'); 

//script paths
var jsFiles = [ 'icons.js', 'geoInput.js' ],  
    jsDest  = '.';

gulp.task('default', function() {  
    return gulp.src(jsFiles)
             .pipe(concat('jquery.geoinput.js'))
             .pipe(gulp.dest(jsDest))
             .pipe(rename('jquery.geoinput.min.js'))
             .pipe(uglify()).on('error', gulpUt.log)
             .pipe(gulp.dest(jsDest));
});
