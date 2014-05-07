# Grunt Cordova Plugin test runner for Jasmine

This plugin will automatically run jasmine tests in /tests directory.

## How to use

You need just three things, two files and one directory. The first file will be the `package.json` that will contain
the required node dependencies. For example:

```java
{
    "name": "hello-world",
    "version": "0.0.1",
    "devDependencies" : {
        "grunt" : "~0.4.2",
        "grunt-cordova-plugin-jasmine" : "~0.0.9"
    }
}
```

Remember to change the `grunt-cordova-plugin-jasmine` version to the latest one. Then you need a `Gruntfile.js`,
in which you need to call `grunt.loadNpmTasks('grunt-cordova-plugin-jasmine');` and then register a task, which will
run the `test-cordova-plugin` task. Also you need at least target in your configuration. Example `Gruntfile.js` would
look like this:

```java
module.exports = function (grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        'test-cordova-plugin': {
            default: {
            }
        }
    });

    grunt.loadNpmTasks("grunt-cordova-plugin-jasmine");
    grunt.registerTask('test', 'test-cordova-plugin');
};
```

Now you can call `grunt test` in the directory with `Gruntfile.js` to run the `test-cordova-plugin` task. The last thing
to setup is directory with tests. You need to create a folder named `tests` in the same directory the `Gruntfile.js` is
in and then you can put javascript files into the directory. All script files will be loaded into the `index.html` page
which will be tested, so you can split your tests into multiple files if you wish.

Remember that the `Gruntfile.js` has to be in the root of the Cordova plugin you with to test (or check out the options
for an override).

## Options

### deleteTemp
#### default: true

If you wish to keep the temporary Cordova project after tests are completed, just set this option to false. In the
console you can find out where is the temporary project stored.

### pluginDir
#### default: current working directory

You may want to test different location than current directory, in that case, change this option to the path the plugin
is stored in.

### testsDir
#### default: ./tests

If you want to store tests in different directory, just change this option to your desired path and you are all set.