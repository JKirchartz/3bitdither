module.exports = function (grunt) {
	"use strict";

	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.initConfig({
		concat: {
			gleech: {
				files: {
					'dist/gleech.js': [
						"source/header.js",
						"source/helpers.js",
						"source/glitches/*",
						"source/footer.js"
					]
				}
			}
		}});
	// Default task(s).
	grunt.registerTask('default', [ 'concat' ]);

	// grunt.registerTask('server', ['default', 'connect:livereload', 'open', 'watch']);
};
