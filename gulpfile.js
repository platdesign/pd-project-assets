'use strict';
var gulp 		= require('gulp'),
	path 		= require('path'),
	runSequence = require('gulp-sequence'),
	del 		= require('del'),
	ignore 		= require('gulp-ignore')
;



var rootPath 	= __dirname;
var srcPath 	= path.join(rootPath, 'src');
var destPath 	= path.join(rootPath, 'build');



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Javascript
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	var uglify 		= require('gulp-uglify');
	var jshint 		= require('gulp-jshint');
	var stylish 	= require('jshint-stylish');
	var browserify 	= require('gulp-browserify');
	var notify 		= require('gulp-notify');

	gulp.task('js-dev', function() {

		var src = path.join(srcPath, 'js', '**', '*.js');
		var dest = path.join(destPath, 'js');

		var errorHandler = function(error) {
			console.error(error.message);
			var args = Array.prototype.slice.call(arguments);

			notify.onError({
				title: 'Compile Error',
				message: '<%= error.message %>'
			}).apply(this, args);

			// Keep gulp from hanging on this task
			this.emit('end');
		};


		return gulp.src( src )
			.pipe( jshint() )
			.pipe( jshint.reporter(stylish) )
			.pipe( ignore.exclude('**/_*.js') )
			.pipe(browserify({
				insertGlobals : false,
				debug : false
			}))
			.on('error', errorHandler)
			.pipe( gulp.dest( dest ))
		;
	});

	gulp.task('js-build', ['js-dev'], function() {
		var src = path.join(destPath, 'js', '**', '*.js');
		var dest = path.join(destPath, 'js');

		return gulp.src( src )
			.pipe(uglify())
			.pipe( gulp.dest( dest ))
		;
	});

	gulp.task('js-watch', ['js-dev'], function() {

		gulp.watch( path.join(srcPath, 'js', '**', '*.js'), ['js-dev']);
	});



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Styles
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	var sass 			= require('gulp-sass');
	var autoprefixer 	= require('gulp-autoprefixer');
	var minifyCSS 		= require('gulp-minify-css');
	var livereload 		= require('gulp-livereload');

	gulp.task('css-dev', function() {
		var src = path.join(srcPath, 'scss', '**', '*.scss');
		var dest = path.join(destPath, 'css');

		return gulp.src(src)
			.pipe( sass({errLogToConsole: true}) )
			.pipe( autoprefixer('last 3 versions', '> 1%', 'ie 8') )
			.pipe( gulp.dest(dest) )
		;
	});

	gulp.task('css-build', ['css-dev'], function() {

		var src = path.join(destPath, 'css', '**', '*.css');
		var dest = path.join(destPath, 'css');

		return gulp.src(src)
			.pipe( minifyCSS() )
			.pipe( gulp.dest(dest) )
		;
	});

	gulp.task('css-watch', ['css-dev'], function() {
		livereload.listen();
		return gulp.watch(path.join(srcPath, 'scss', '**', '*.scss'), ['css-dev']).on('change', livereload.changed);
	});



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Jade
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	var ignore 		= require('gulp-ignore');
	var	jade		= require('gulp-jade');

	gulp.task('jade-dev', function() {
		var src = path.join(srcPath, 'jade', '**', '*.jade');
		var dest = path.join(destPath, 'html');

		return gulp.src(src)
			.pipe( ignore.exclude('**/_*.jade') )
			.pipe( jade() )
			.pipe( gulp.dest(dest) )
		;
	});

	gulp.task('jade-build', ['jade-dev']);

	gulp.task('jade-watch', ['jade-dev'], function() {

		return gulp.watch(path.join(srcPath, 'jade', '**', '*.jade'), ['jade-dev']);
	});



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Graphics
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	var imagemin 	= require('gulp-imagemin');
	var pngcrush 	= require('imagemin-pngcrush');

	gulp.task('gfx-dev', function() {
		var src = path.join(srcPath, 'gfx', '**', '*');
		var dest = path.join(destPath, 'gfx');
		return gulp.src(src).pipe( gulp.dest(dest) );
	});

	gulp.task('gfx-build', function() {
		var src = path.join(srcPath, 'gfx', '**', '*');
		var dest = path.join(destPath, 'gfx');

		return gulp.src(src)
			.pipe(imagemin({
				progressive: true,
				svgoPlugins: [{removeViewBox: false}],
				use: [pngcrush()]
			}))
			.pipe(gulp.dest(dest));
	});

	gulp.task('gfx-watch', ['gfx-dev'], function() {

		return gulp.watch(path.join(srcPath, 'gfx', '**', '*'), ['gfx-dev']);
	});



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Default/Clean/Dev/Build
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	// Default
	gulp.task('default', ['dev']);

	// Clean
	gulp.task('clean-build', function(cb) {
		return del([destPath], cb);
	});


	// Dev
	gulp.task('dev', [], function() {
		return runSequence('clean-build', [
			'js-watch',
			'css-watch',
			'jade-watch',
			'gfx-watch'
		], function() {
			console.log('Enjoy developing!');
		});
	});

	// Build
	gulp.task('build', function() {

		return runSequence(
			'clean-build',
			'js-build',
			'css-build',
			'jade-build',
			'gfx-build'
		);

	});
