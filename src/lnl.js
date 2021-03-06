/*!
 * LockNLoad - 2009 Max Aller <nanodeath@gmail.com>
 * ---------
 * A convenient inversion of control container
 * 
 * Released under the MIT license.
 * 
 * http://github.com/nanodeath/LockNLoad
 * http://blog.maxaller.name/tag/locknload/
*/
/**
 * Example:
 * LNL.loadConfig({
 * 	"celebratory_object": {
 * 		class: "Confetti",
 * 		args: [], // optional, constructor arguments
 * 		lifecycle: "prototype", // singleton or prototype
 *		props: { // properties -- variables and methods to set
 *			"color": "red", // sets your_object.color = "red"
 *			"quantity()": 20 // calls your_object.setQuantity(20) 
 *		}
 * 	},
 * 	"censor_function": {
 * 		function: "SimpleCensor", // functions are always singletons
 * 		args: ["_", ['darn', 'dang', 'fudge', 'phooie']] // _ arguments will be merged into this
 * 	}
 * });
 * 
 * var celebrate = LNL.$("celebratory_object_1");
 * celebrate.color == "red"
 * celebrate.getQuantity() == 20;
 * 
 * var censor = LNL.$("censor_function");
 * censor("That darn cat!") == "That **** cat!";
 */
(function(){
    var window = this, undefined, _LNL, LNL = window.LNL = {}, func = "function", object = "object";
    
    var DEFAULT_GROUP = "default";
    
    var ObjectDatabase = {};
    
    function EmptyClass(){}
    
    var Specifications = {};

	// Clear out everything -- this was added to help singleton test cases work after multiple runs	
	LNL.reset = function(){
		Specifications = {};
		ObjectDatabase = {}; 
	}
    
	LNL.OVERWRITE = {
		ERROR: 0,
		SKIP: 1,
		IGNORE: 2
	};
	
	/**
	 * 
	 * @param {Object} specification
	 * @param {Object} overwrite_behavior options are in LNL.OVERWRITE
	 */
    LNL.loadConfig = function(specification, overwrite_behavior){
		switch(overwrite_behavior){
			case LNL.OVERWRITE.SKIP:
				for(var s in specification){
					if(!Specifications[s]){
						Specifications[s] = specification[s];
					}
				}
				break;
			case LNL.OVERWRITE.IGNORE:
				//extend(true, Specifications, specification);
				for(var s in specification){
					Specifications[s] = specification[s];
				}
				break;
			default:
				for(var s in specification){
					if(Specifications[s]){
						throwError("id conflict, " + s + " is already defined.");
					} else {
						Specifications[s] = specification[s];
					}
				}
		}
    };
	
	LNL.version = 0.2;
    
	// this is a property of the spec object itself
    var SPEC_TYPE = {
        CLASS: "class",
		FUNCTION: "function",
		VALUE: "value"
    }
	
	// this is in the "lifecycle" attribute of the spec
	var SPEC_LIFECYCLE = {
		SINGLETON: "singleton",
		PROTOTYPE: "prototype"
	}
    
    function getLifecycle(spec){
		for(type in SPEC_LIFECYCLE){
			var value = SPEC_LIFECYCLE[type];
			if(spec.lifecycle == value){
				return value;
			}
		}
		return null;
    }
	
	function getType(spec){
		for(type in SPEC_TYPE){
			var value = SPEC_TYPE[type];
			if(spec[value]){
				return SPEC_TYPE[type];
			}
		}
		return null;
	}
	
	// array1: [_, hello, _, day!], array2: [oh, good]; #=> ['oh', 'hello', 'good', 'day!']
	function weaveArrays(array1, array2){
		var ret = [];
		for(var i = 0, j = 0, l_i = array1.length, l_j = array2.length; i < l_i; i++){
			if(array1[i] == "_"){
				if (j < l_j) {
					ret.push(array2[j++]);
				} else {
					ret.push(undefined);
				}
			} else {
				ret.push(array1[i]);
			}
		}
		return ret;
	}
	
	function getSpec(id){
        try {
            return Specifications[id];
        } 
        catch (e) {
			throwError("specification not found", id);
        }
	}
	
	function applyConstructor(slate, spec){
		var constructor = spec['class'];
        if (typeof(constructor) == "string") {
            constructor = spec['class'] = eval(constructor);
        }
		
		var constructor_args = spec.args ? spec.args : [];
		constructor.prototype.constructor.apply(slate, constructor_args);		
	}
	
	function applyProperties(slate, spec){
		for (var setter in spec.props) {
        	var isMethod = setter.indexOf("()") == setter.length - 2;
			if(isMethod){
				var method_name = setter.slice(0, -2);
				method_name = "set" + method_name.charAt(0).toUpperCase() + method_name.slice(1);
				var method = slate[method_name];
				if(!method){
					throwError("does not have method " + method_name, id);
				}
				var args = spec.props[setter];
				if(!(args instanceof Array)){
					args = [args];
				}
				method.apply(slate, args);
			} else {
				slate[setter] = spec.props[setter];
			}
        }
	}
	
	/**
	 * This instantiates a new object with the provided id.
	 * @param {String} id
	 * @return A new object, function, or primitive
	 */
	function instantiate(id){
		var spec = getSpec(id);
		
		// If we found a specification for the object
        if (spec) {
			// And that specification is for a Class object
			switch(getType(spec)){
				case SPEC_TYPE.CLASS:
					var slate = new EmptyClass();
					
					applyConstructor(slate, spec);
		            applyProperties(slate, spec);
	                
	                return slate;
				case SPEC_TYPE.FUNCTION:
					var func = spec['function'];
	                if (typeof(func) == "string") {
	                    func = spec['function'] = eval(func);
	                }
					if(spec.args){
						var orig_func = func;
						func = function(){
							var args = weaveArrays(spec.args, arguments);
							return orig_func.apply(this, args);
						}
					}
	                return func;
				case SPEC_TYPE.VALUE:
					var value = spec['value'];
					if(typeof value == object){
						return extend(true, {}, value);
					} else {
						return spec['value'];
					}
			}
        }
		return null;
	}
    
	/**
	 * Private function for retrieving a particular object from the internal
	 * object database.  One instance of the object is acquired and put into
	 * the database and kept.  When requested, the same instance is always
	 * returned.
	 * @param {String} id
	 */
    function fetchFromDB(id){
        var obj = null;
		
		if(ObjectDatabase[id] == null){
			obj = instantiate(id);
			if(obj){
				ObjectDatabase[id] = obj;
				return obj;
			}
		}
		return ObjectDatabase[id];
    }
    
	/**
	 * This is the main function that you'll be interacting with.
	 * Pass in the ID of the object you want, and optionally the group
	 * associated with the object (when its specification was loaded).
	 * @param {String} id identifier for the particular instance you want 
	 */
    LNL.get = LNL.$ = function(id){
        var spec = getSpec(id);
		
        if (spec) {
			var lifecycle = getLifecycle(spec);
			var type = getType(spec);
			
			// Validation of type/lifecycle combinations
			var realType = typeof spec.value;
			if(type == SPEC_TYPE.VALUE){
				if(realType == func){
					throwError("You passed a function in as a value spec.  Perhaps you want a function spec instead?");
				}
				
				if(realType != object) {
					if (lifecycle) {
						throwError("Non-object value specs can't specify a lifecycle -- they're always prototype.", id);
					}
					lifecycle = "prototype";
				}
			} else if(type == SPEC_TYPE.FUNCTION && lifecycle == SPEC_LIFECYCLE.PROTOTYPE){
				throwError("function prototypes not supported (yet)", id);
			}
			
            switch (lifecycle) {
                case SPEC_LIFECYCLE.PROTOTYPE:
					return instantiate(id);
                default:
					return fetchFromDB(id);
            }
        }
    }
	
	// extend, borrowed from jQuery
	var extend = function() {
		// copy reference to target object
		var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;
	
		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}
	
		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && toString.call(obj) !== "[object Function]" )
			target = {};
	
		for ( ; i < length; i++ )
			// Only deal with non-null/undefined values
			if ( (options = arguments[ i ]) != null )
				// Extend the base object
				for ( var name in options ) {
					var src = target[ name ], copy = options[ name ];
	
					// Prevent never-ending loop
					if ( target === copy )
						continue;
	
					// Recurse if we're merging object values
					if ( deep && copy && typeof copy === object && !copy.nodeType )
						target[ name ] = extend( deep, 
							// Never move original objects, clone them
							src || ( copy.length != null ? [ ] : { } )
						, copy );
	
					// Don't bring in undefined values
					else if ( copy !== undefined )
						target[ name ] = copy;
	
				}
	
		// Return the modified object
		return target;
	};

	
	/**
	 * Error-throwing convenience method
	 * @param {String} message Text to propagate in the exception
	 * @param {String} id the offending spec, if applicable
     * @exception Error 
	 */
	function throwError(message, id){
		var errorMessage = ["LNL: "];
		var spec = false;
		if(id){
			errorMessage.push(id);
			spec = true;
			
			errorMessage.push(": ");
		}
		errorMessage.push(message);
		throw new Error(errorMessage.join(""));
	}    
})();
