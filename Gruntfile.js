module.exports = function (grunt) {
	"use strict";

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-browserify');

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
		},
		jshint: {
			dest: "dest/**.js"
		},
		browserify: {
			"dist" : {
				"files" : {
					"site/js/gleech-browser.js" : "dist/gleech.js",
					"dist/gleech-browser.js" : "dist/gleech.js"
				}
			}
		}
	});
	// Default task(s).
	grunt.registerTask('default', [ 'concat' ]);
	grunt.registerTask('check', [ 'concat', 'jshint' ]);
	grunt.registerTask('deploy', [ 'concat', 'jshint', 'browserify' ]);

};
