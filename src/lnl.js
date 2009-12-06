/**
 * Example:
 * LNL.load({
 * 	"celebratory_object": {
 * 		class: "Confetti",
 * 		args: [], // optional, constructor arguments
 * 		type: "clone", // singleton or clone
 *		props: { // properties -- variables and methods to set
 *			"color": "red", // sets your_object.color = "red"
 *			"quantity()": 20 // calls your_object.setQuantity(20) 
 *		}
 * 	},
 * 	"censor_function": {
 * 		function: "SimpleCensor",
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
    var window = this, undefined, _LNL, LNL = window.LNL = {};
    
    var DEFAULT_GROUP = "default";
    
    var ObjectDatabase = {};
    
    function EmptyClass(){}
    
    
    var Specifications = {};

	// Clear out everything -- this was added to make singleton test cases work after multiple runs	
	LNL.reset = function(){
		Specifications = {};
		ObjectDatabase = {}; 
	}
    
    LNL.loadJSON = function(specification, group){
        if (!group) 
            group = DEFAULT_GROUP; 
        Specifications[group] = specification;
    };
    
    var SPEC_TYPE = {
        SINGLETON: "singleton",
        PROTOTYPE: "prototype",
		FUNCTION: "function"
    }
    
    var getType = function(object){
		for(type in SPEC_TYPE){
			var value = SPEC_TYPE[type];
			if(object[value] || object.type == value){
				return value;
			}
		}
		return null;
    }
    
    var getConstructor = function(cons){
        switch (typeof(cons)) {
            case "function":
                return cons;
                break;
            case "string":
                return eval(cons);
                break;
            default:
                return null;
        }
    }
	
	// array1: [_, hello, _, day!], array2: [oh, good]; #=> ['oh', 'hello', 'good', 'day!']
	function fuseArrays(array1, array2){
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
	
	function instantiateObject(id, group){
		if (!group) 
            group = DEFAULT_GROUP;
        var ret = null;
		
		var obj;
        try {
            obj = Specifications[group][id];
        } 
        catch (e) {
            throw e;
        }
		
		// If we found a specification for the object
        if (obj) {
			// And that specification is for a Class object
            if (obj['class']) {
                var constructor = obj['class'];
                if (typeof(constructor) == "string") {
                    constructor = obj['class'] = eval(constructor);
                }
                var slate = new EmptyClass();
                
                var constructor_args = obj.args ? obj.args : [];
                constructor.prototype.constructor.apply(slate, constructor_args);
                
                for (var setter in obj.props) {
                	var isMethod = setter.indexOf("()") == setter.length - 2;
					if(isMethod){
						var method_name = setter.slice(0, -2);
						method_name = "set" + method_name[0].toUpperCase() + method_name.slice(1);
						var method = slate[method_name];
						if(!method){
							throw new Error(group + "#" + id + " does not have method " + method_name)
						}
						var args = obj.props[setter];
						if(typeof(args) == "string"){
							args = [args];
						}
						method.call(slate, args);
					} else {
						slate[setter] = obj.props[setter];
					}
                }
                
                return slate;
            } 
			// Specification is not for a Class, but rather a Function
			else if (obj['function']) {
                var func = obj['function'];
                if (typeof(func) == "string") {
                    func = obj['function'] = eval(func);
                }
				if(obj.args){
					var orig_func = func;
					func = function(){
						var args = fuseArrays(obj.args, arguments);
						return orig_func.apply(this, args);
						
					}
				}
                return func;
            }
        }
		return null;
	}
    
    function fetchFromDB(id, group){
        if (!group) 
            group = DEFAULT_GROUP;
        var obj = null;
		
		if(ObjectDatabase[group] == null || ObjectDatabase[group][id] == null){
			obj = instantiateObject(id, group);
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
    
    LNL.get = LNL.$ = function(id, group){
        if (!group) 
            group = DEFAULT_GROUP;
        var obj;
        try {
            obj = Specifications[group][id];
        } 
        catch (e) {
            throw e;
        }
		
        if (obj) {
            switch (getType(obj)) {
                case SPEC_TYPE.PROTOTYPE:
					return instantiateObject(id, group);
                default:
					return fetchFromDB(id, group);
            }
        }
    }
    
})();
