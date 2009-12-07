LockNLoad
=========

2009 Max Aller <nanodeath@gmail.com>

Introduction
------------

LockNLoad provides an Inversion of Control container, which is essentially a
configurable "mega"-factory.  Once configured, you can query the container
for instances of classes (singleton or prototype) or functions.  This
provides a convenient level of abstraction for your application from
implementations of classes, which is especially helpful if you have (or
would like) different implementations for different environments, such as
special classes when running in a development environment.With LockNLoad, 
you could just load a different configuration if you were in a development
environment.  

Another example is what if the environment differs in that it's a different 
browser -- instead of adding "if browser x do a else if browser y do b" in 
every method in your code, you could simply use a browser-aware configuration 
that loaded in an implementation that ONLY knew how to do "a" or a separate 
implementation that only knew how to do "b".

How to Use
----------

1. Load lnl.js in your application
2. Call LNL.loadConfig(javascript_object) where javascript_object is your configuration
3. Call LNL.get (aliased to LNL.$) to pull out implementations of objects

Walkthrough example
-------------------

Suppose you want to load a "celebratory object" and some sort of censor
function.  Your configuration may look something like what follows.

    LNL.loadConfig({
      "celebratory_object": {
        "class": "Confetti",
        "args": [], // optional, constructor arguments
        "lifecycle": "prototype", // singleton or prototype
        "props": { // properties -- variables and methods to set
          "color": "red", // sets your_object.color = "red"
          "quantity()": 20 // calls your_object.setQuantity(20) 
        }
      },
      "censor_function": {
        function: "SimpleCensor", // functions are always singletons
          "args": ["_", ['darn', 'dang', 'fudge', 'phooie']] // _ arguments will be merged into this
      }
    });
    
    var myObject = LNL.$("celebratory_object");
    var myFunc = LNL.$("censor_function")

### Specifying Objects

When configuring an object, you specify a "class" attribute that represents
the constructor of the object.  You can specify a String or a function
reference here -- strings will be evaluated when the object is first loaded. 
Required.  Domain: string, function reference.

Args is an array consisting of constructor arguments.  
Optional.  Default: [].  Domain: any array.

Lifecycle is an optional string specifying whether the object should be a
singleton or a prototype.  If it's a prototype, each time you ask the IoC
container for a "foo" object you'll get a new "foo" object, whereas if it's
a singleton you'll get a reference to the same "foo" object each time. 
Optional.  Default: "singleton".  Domain: "singleton", "prototype".

Props are properties you can set on instances returned from the container. 
Caveat 1: if the property ends in a (), a method is called to set that 
property instead, as opposed to setting the property directly on the object.
Caveat 2: if the property ends in a (), and the value is an array, the first, 
second, etc values in the array will be used as the first, second, etc 
arguments to the setter.
    "myproperty": ["foo", "bar"] // => setMyproperty("foo", "bar")
This may be confusing if you're trying to actually pass in a array as an 
argument.  In that case, put the array itself in an array:
    "myvector": [[3.0, 5.0]] // => setMyvector([3.0, 5.0])
   
Default: {}.  Domain: any hash.


### Specifying Functions

Functions are only a little different.  They don't have properties or
lifecycle (they're always singleton) and args is treated specially.

If you specify an args array, pulling the function from the IoC container
will actually create a new function layered on top of the original.  For
example, assume the SimpleCensor function takes two arguments -- a string
and a list of bad words to block.  Rather than having to passing in this
list of bad words every time, you can specify that argument in the
configuration.  With the above configuration, the "censor_function" is
actually a function that takes one argument and calls SimpleCensor with that
argument before a list of bad words. _s are placeholders for arguments in the 
function returned to the calling code.

Groups
------
What if you want to load multiple configurations?  The current solution for
this is to put each configuration into its own group.  An example:

    var myConfig = { ... }, hisConfig = { ... };
    LNL.loadConfig(myConfig, "group1");
    LNL.loadConfig(hisConfig, "group2");

    var myObject = LNL.$(..., "group1");
    var hisFunc = LNL.$(..., "group2");

If you load two configurations into the same group, the original
configuration will be *overwritten*.  There is no merging logic with
configurations.  If you really want to merge, merge the configurations
before loading them into the container.

Similarities to Spring
----------------------
If you're familiar with Spring, this will seem very familiar to you.  Spring
also has an IoC container and uses similar terminology, with regards to
"singleton" and "prototype".  However, compared to Java, an implementation
in Javascript has severe limitations.  Where in Java, one could rely on an
interface (or rather, a ClassCastException) to tell you when a Foo doesn't
really have methods bar() or baz(), with Javascript you won't get an error
until you try to call bar() or baz().  Bear in mind that any components you
could swap in at a particular site in the configuration should
conceptually all implement the same interface (analagous constructor,
analagous public methods) even if there's no way to actually enforce this.

Design Principles
-----------------
1. Simple
2. Small
3. Fast
4. No external dependencies
5. Easy to read and write
6. Well-tested

Design Justifications
---------------------
*   Why no configuration merging?

    Because if my library defines specs with ids "a" and "b", and another
    library on the page specifies "b" and "c", it may be a while before you
    realize that the second lib overwrote part of the first lib's configuration.
    Whereas no configuration merging means you pretty much have to specify a
    group/namespace to ensure you don't stomp/get stomped on by other libraries.
    
    I'm considering adding configuration merging later and abandoning the notion
    of groups...

*   Why can't I make my function a prototype?

    Because I haven't figured out how to make a copy of a function.  At this
    point I don't think it's possible.

Other stuff
-----------

### Contributing
You are, of course, more than welcome to cut issues or fork the repo.  I'll
gladly reincorporate your changes back into my fork, given sufficient unit
tests have been written and consistency with above-stated design principles.

### Tests
For testing information, see runningTheTests.

### License
This library is licensed under the MIT License.  Please see LICENSE.