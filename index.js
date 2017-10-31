#!/usr/bin/env node
/*
 * index.js
 * Copyright (C) 2017 jkirchartz <me@jkirchartz.com>
 *
 * Distributed under terms of the GPL3.0 license.
 */
'use strict';
var gleech = require('./dist/gleech.js');
var vorpal = require('vorpal')();

vorpal.history('gleech');

vorpal
.command('glitch <input> <output> [operation] [parameters...]',
		'Glitches an image with optional type and parameters')
.action(function(args, callback) {
	var input = args.input;
	var output = args.output;
	var operation = args.operation;
	var parameters = args.parameters;

	gleech.read(input, function(err, image) {
		if (operation && parameters) {
			image[operation](parameters);
		} else if (operation && !parameters) {
			image[operation]();
		} else {
			vorpal.log("please provide a function name");
		}
		image.write(output);
	});
	callback();
});

vorpal.command('list', 'Lists available functions')
.action(function(args, callback) {
	var output = "";
	output += ('\nGlitches:\n\n');
	for (var prop in gleech.prototype) {
		if (typeof gleech.prototype[prop] === 'function' &&
				gleech.prototype[prop].name){
			output += gleech.prototype[prop].name + ' ';
		}
	}
	output += ('\n\nJimp functions:\n\n');
	for (var prop in gleech.prototype) {
		if (typeof gleech.prototype[prop] === 'function' &&
				! gleech.prototype[prop].name){
			output += String(prop) + ' ';
		}
	}
	vorpal.log(output);
	callback();
});

vorpal.delimiter('gleech$').show();


