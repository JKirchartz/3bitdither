#!/usr/bin/env node
'use strict';
/*
 * Gleech
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Distributed under terms of the GPL3.0 license.
 */
var gleech = require('./dist/gleech.js');
var cmdr = require('commander');

cmdr
.command('glitch <input> <output> [operation] [parameters...]')
.description('Glitches an image with optional type and parameters')
.action(function(input, output, operation, parameters) {
	gleech.read(input, function(err, image) {
		if (operation && parameters) {
			image[operation].apply(this, parameters);
		} else if (operation && !parameters) {
			image[operation]();
		} else {
			console.log("please provide a function name");
		}
		image.write(output);
	});
});

cmdr.command('list')
.description('Lists available functions')
.action(function() {
	var output = "";
	output += ('\nGlitches:\n\n');
	for (var prop in gleech.prototype) {
		if (typeof gleech.prototype[prop] === 'function' &&
				gleech.prototype[prop].name){
			output += gleech.prototype[prop].name + ' ';
		}
	}
	output += ('\n\nJimp functions:\n\n');
	for (var prop2 in gleech.prototype) {
		if (typeof gleech.prototype[prop2] === 'function' &&
				! gleech.prototype[prop2].name){
			output += String(prop2) + ' ';
		}
	}
	console.log(output);
});

cmdr.version('0.1.0').parse(process.argv);
