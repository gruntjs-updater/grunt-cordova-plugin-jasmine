/*
 * grunt-cordova-plugin-jasmine
 * https://github.com/TadeasKriz/grunt-cordova-plugin-jasmine
 *
 * Copyright (c) 2014 Tadeas Kriz
 * Licensed under the Apache-2.0 license.
 */

'use strict';

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('test-cordova-plugin', 'The best Grunt plugin ever.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var path = require('path');

        var options = this.options({
            deleteTemp: true,
            pluginDir: process.pwd(),
            testsDir: path.join(process.pwd(), 'tests')
        });

        var cordova = require('cordova');
        var temp = require('temp');
        if(options.deleteTemp == true) {
            temp = temp.track();
        }

        var qfs = require('q-io/fs');
        var Q = require('q');

        var phantomCallback = function (deffered) {
            return function (error, value) {
                if (error) {
                    deffered.reject(new Error(error));
                } else {
                    deffered.resolve(value);
                }
            };
        };

        var workingDir = process.cwd();
        var dir = temp.mkdirSync();
        var wwwDir = path.join(dir, 'www');
        var testDir = path.join(wwwDir, 'tests');

        grunt.log.writeln('Temp dir: ' + dir);

        var done = this.async();
        var _phantomInstance;
        cordova.raw.create(dir)
            .then(function () {
                return qfs.removeTree(wwwDir)
            })
            .then(function () {
                return qfs.copyTree(path.join(__dirname, 'www_files'), wwwDir);
            })
            .then(function () {
                return qfs.copyTree(options.testsDir, testDir);
            })
            .then(function () {
                return qfs.list(testDir);
            })
            .then(function (tests) {
                var testScripts = '<!-- Tests -->\n';
                tests.forEach(function(test) {
                    testScripts += '<script type="text/javascript" src="tests/' + test + '"></script>\n';
                });

                return qfs
                    .read(path.join(wwwDir, "/index.html"))
                    .then(function(indexContent) {
                        var replacedIndexContent = indexContent.replace(/<\?=test-scripts>/g, testScripts);

                        return qfs.write(path.join(wwwDir, "/index.html"), replacedIndexContent);
                    });
            })
            .then(function () {
                grunt.file.setBase(dir);
            })
            .then(function () {
                return cordova.raw.platform('add', 'ios');
            })
            .then(function () {
                return cordova.raw.plugin('add', options.pluginDir);
            })
            .then(function () {
                return cordova.raw.serve();
            })
            .then(function () {
                var phantom = require('node-phantom');

                var deferred = Q.defer();
                phantom.create(phantomCallback(deferred), { phantomPath: require('phantomjs').path });
                return deferred.promise;
            })
            .then(function (phantom) {
                _phantomInstance = phantom;
                var deferred = Q.defer();
                phantom.createPage(phantomCallback(deferred));
                return deferred.promise;
            })
            .then(function (page) {
                var deferred = Q.defer();
                page.open("http://localhost:8000/ios/www/", phantomCallback(deferred));

                return deferred.promise.then(function (status) {
                    grunt.log.writeln('PhantomJS status: ' + status);
                    return page;
                });
            })
            .then(function (page) {
                var wait = function () {
                    var deferred = Q.defer();
                    setTimeout(deferred.resolve, 500);
                    return deferred.promise;
                };

                var checkTests = function () {
                    var deferred = Q.defer();
                    page.evaluate(function () {
                        return jasmine.getJSReport();
                    }, function (error, result) {
                        if (error) {
                            deferred.reject(new Error(error));
                        } else {
                            if (result) {
                                deferred.resolve(result);
                            } else {
                                deferred.resolve(wait().then(function () {
                                    return checkTests();
                                }));
                            }
                        }
                    });
                    return deferred.promise;
                };
                return checkTests();
            })
            .then(function (report) {
                _phantomInstance.exit();

                grunt.log.writeln('Tests ' + (report.passed ? 'PASSED' : 'FAILED') + ' in ' + report.durationSec + 's');

                var logFailure = function (failure) {
                    grunt.log.writeln('Failure message: ' + failure.message);
                };

                var logSpec = function (spec) {
                    // FIXME add support for 'skipped'
                    // FIXME add support for 'totalCount', 'passedCount', 'failedCount'
                    grunt.log.writeln('Spec "' + spec.description + '" ' + (spec.passed ? 'PASSED' : 'FAILED') + ' in ' + spec.durationSec + 's');

                    spec.failures.forEach(logFailure);
                };

                var logSuite = function (suite) {
                    grunt.log.writeln('Suite "' + suite.description + '" ' + (suite.passed ? 'PASSED' : 'FAILED') + ' in ' + suite.durationSec + 's');

                    suite.specs.forEach(logSpec);

                    suite.suites.forEach(logSuite);

                };

                report.suites.forEach(logSuite);


                done(report.passed);
            })
            .fail(function (err) {
                grunt.log.writeln('Error: ' + err);
                done(false);
            })
            .fin(function () {
                grunt.file.setBase(workingDir);
            })
            .done();
    });

};
