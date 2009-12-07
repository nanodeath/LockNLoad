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
    
    LNL.loadConfig = function(specification, group){
        if (!group) 
            group = DEFAULT_GROUP; 
        Specifications[group] = specification;
    };
	
	LNL.version = 0.15;
    
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
	
	function getSpec(id, group){
        try {
            return Specifications[group][id];
        } 
        catch (e) {
			throwError("specification not found", id, group);
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
				method_name = "set" + method_name[0].toUpperCase() + method_name.slice(1);
				var method = slate[method_name];
				if(!method){
					throwError("does not have method " + method_name, id, group);
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
	 * @param {Object} id
	 * @param {Object} group
	 */
	function instantiate(id, group){
		if (!group) 
            group = DEFAULT_GROUP;
        var ret = null;
		
		var spec = getSpec(id, group);
		
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
					return spec['value'];
			}
        }
		return null;
	}
    
	/**
	 * Private function for retrieving a particular object from the internal
	 * object database.  One instance of the object is acquired and put into
	 * the database and kept.  When requested, the same instance is always
	 * returned.
	 * @param {Object} id
	 * @param {Object} group
	 */
    function fetchFromDB(id, group){
        if (!group){
            group = DEFAULT_GROUP;
		}
        var obj = null;
		
		if(ObjectDatabase[group] == null || ObjectDatabase[group][id] == null){
			obj = instantiate(id, group);
			if(obj){
				if (ObjectDatabase[group] == null) {
					ObjectDatabase[group] = {};
				}
				ObjectDatabase[group][id] = obj;
				return obj;
			}
		}
		if(ObjectDatabase[group]){
			return ObjectDatabase[group][id];
		} else {
			return null;
		}
    }
    
	/**
	 * This is the main function that you'll be interacting with.
	 * Pass in the ID of the object you want, and optionally the group
	 * associated with the object (when its specification was loaded).
	 * @param {String} id identifier for the particular instance you want 
	 * @param {String} group if any, what namespace to check for the identifier
	 */
    LNL.get = LNL.$ = function(id, group){
        if (!group) 
            group = DEFAULT_GROUP;
        var spec = getSpec(id, group);
		
        if (spec) {
			var lifecycle = getLifecycle(spec);
			var type = getType(spec);
			
			// Validation of type/lifecycle combinations
			if(type == SPEC_TYPE.VALUE){
				if (lifecycle) {
					throwError("value specs can't specify lifecycle.  Primitives are always 'prototype' and complex types are always 'singleton'", id, group);
				} else {
					var realType = typeof spec.value;
					if(realType == func || realType == object){
						lifecycle = "singleton";
					} else {
						lifecycle = "prototype";
					}
				}
			} else if(type == SPEC_TYPE.FUNCTION && lifecycle == SPEC_LIFECYCLE.PROTOTYPE){
				throwError("function prototypes not supported (yet)", id, group);
			}
			
            switch (lifecycle) {
                case SPEC_LIFECYCLE.PROTOTYPE:
					return instantiate(id, group);
                default:
					return fetchFromDB(id, group);
            }
        }
    }
	
	function throwError(message, id, group){
		var errorMessage = ["LNL: "];
		var spec = false;
		if(id){
			errorMessage.push(id);
			spec = true;
			
			if(group && group != DEFAULT_GROUP){
				errorMessage.push(" in ");
				errorMessage.push(group);
			}
			errorMessage.push(": ");
		}
		errorMessage.push(message);
		throw new Error(errorMessage.join(""));
	}    
})();
