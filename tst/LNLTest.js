LNLTest = TestCase("LNLTest");

function SimpleCensor(string, bad_words){
	for(var w in bad_words){
		var word = bad_words[w];
		var stars = [];
		for(var i = 0; i < word.length; i++){
			stars.push("*");
		}
		
		string = string.replace(new RegExp(word, 'i'), stars.join(""));
	}
	return string;
}

LNLTest.prototype.setUp = function(){
	LNL.reset();
}

LNLTest.prototype.testIoCFunction = function(){
	LNL.loadConfig({
	    "censor_function": {
	        "function": SimpleCensor,
	        args: ["_", ['darn', 'dang', 'fudge', 'phooie']] // _ arguments will be merged into this
	    }
	});
	
	var my_wimpy_censor_function = LNL.$("censor_function");
	assertEquals("**** it, stop doing that you **** kids!", my_wimpy_censor_function("Darn it, stop doing that you dang kids!"));
}

LNLTest.prototype.testIoCObject = function(){
	LNL.loadConfig({
	    "celebratory_object": {
	        "class": "Confetti",
	        props: { // properties -- variables and methods to set
	            "color": "red", // sets your_object.color = "red"
	            "quantity()": 20, // calls your_object.setQuantity(20),
	            "size()": ["1.5 in", "0.25 in"] // calls your_object.setSize("1.5 in", "0.25 in")
	        }
	    }
	});
	
	var my_celebratory_object = LNL.$("celebratory_object");
	
	assertEquals("red", my_celebratory_object.color)
	assertEquals(20, my_celebratory_object.getQuantity())
	assertEquals("1.5 in", my_celebratory_object.width);
	assertEquals("0.25 in", my_celebratory_object.height);
}

function Confetti(shape){
	var quantity = 0;
	this.setQuantity = function(q){
		quantity = q;
	}
	this.getQuantity = function(){ return quantity; }
	
	var recipients = [];
	this.addRecipient = function(newly_wed) {
		recipients.push(newly_wed);
		return this;
	}
	this.getRecipients = function(){
		return recipients;
	}
	
	this.getShape = function(){
		return shape;
	}
	
	this.setSize = function(width, height){
		this.width = width;
		this.height = height;
	}
}

LNLTest.prototype.testIoCSingleton = function(){
	LNL.loadConfig({
	    "celebratory_singleton": {
	        "class": "Confetti",
	        args: ['pointy'], // constructor arguments
	        type: "singleton", // singleton or clone
	        props: { // properties -- variables and methods to set
	            "quantity()": 20 // calls your_object.setQuantity(20) 
	        }
	    }
	});
	
	var singleton = LNL.$("celebratory_singleton");
	assertEquals(20, singleton.getQuantity())
	singleton.setQuantity(30);
	assertEquals(30, singleton.getQuantity())
	
	singleton.addRecipient("Joan").addRecipient("Melanie");
	assertEquals(["Joan", "Melanie"], singleton.getRecipients())
	
	assertEquals("pointy", singleton.getShape());
	
	var singleton2 = LNL.$("celebratory_singleton");
	assertEquals(30, singleton2.getQuantity())
	assertEquals(["Joan", "Melanie"], singleton2.getRecipients())
	singleton2.setQuantity(25);
	assertEquals(25, singleton2.getQuantity())
	assertEquals(25, singleton.getQuantity())
	
	assertTrue(singleton === singleton2)
}


LNLTest.prototype.testIoCClone = function(){
	LNL.loadConfig({
		"celebratory_clone": {
			"class": "Confetti",
			lifecycle: "prototype",
			props: {
				"quantity()": 20 
			}
		}
	});
	
	var first = LNL.$("celebratory_clone");
	assertEquals(20, first.getQuantity())
	first.setQuantity(30);
	assertEquals(30, first.getQuantity())
	
	first.addRecipient("Joan").addRecipient("Melanie");
	assertEquals(["Joan", "Melanie"], first.getRecipients())
	
	var second = LNL.$("celebratory_clone");
	assertEquals([], second.getRecipients())
	assertEquals(20, second.getQuantity())
	second.setQuantity(5000);
	second.addRecipient("Claire");
	
	assertEquals(5000, second.getQuantity())
	assertEquals(["Claire"], second.getRecipients())
	
	assertEquals(30, first.getQuantity())
	assertEquals(["Joan", "Melanie"], first.getRecipients())
}



LNLTest.prototype.testIoCFunctionClone = function(){
	(function(){
		var counter = 0;
		
		window.SweetCounter = function(){
			return ++counter;
		}
	})();
	
	LNL.loadConfig({
	    "counter_function": {
	        "function": "SweetCounter",
			lifecycle: "prototype"
	    }
	});

	try {
		var my_counter = LNL.$("counter_function");
		var number = my_counter();
		fail("instantiating a function clone should have raised error")
	} catch(e){
		assertEquals("LNL: counter_function: function prototypes not supported (yet)", e.message);
	}
}

LNLTest.prototype.testIoCFunctionSingleton = function(){
	(function(){
		var counter = 0;
		
		window.SweetCounter = function(){
			return ++counter;
		}
	})();

	LNL.loadConfig({
		"counter_function": {
			"function": "SweetCounter",
			lifecycle: "singleton"
		}
	});
	
	var my_counter = LNL.$("counter_function");
	assertEquals(1, my_counter());
	
	var my_counter2 = LNL.$("counter_function");
	assertEquals(2, my_counter2());
	assertEquals(3, my_counter());
}

LNLTest.prototype.testIoCFunctionAsConstructor = function(){
	(function(){
		window.Sound = function(soundLocation, looping){
			this.soundLocation = soundLocation;
			if(!looping){
				looping = false;
			}
			this.looping = looping;
		}
	})();
	
	LNL.loadConfig({
		"basic_sound": {
			"function": Sound
		},
		"looping_sound":{
			"function": "Sound",
			args: ["_", true]
		}
	});
	
	var my_basic_sound_class = LNL.$("basic_sound");
	var my_basic_sound = new my_basic_sound_class("sound.mp3");
	assertEquals("sound.mp3", my_basic_sound.soundLocation);
	assertEquals(false, my_basic_sound.looping);
	
	var my_looping_sound_class = LNL.$("looping_sound");
	var my_looping_sound = new my_looping_sound_class("sound2.mp3");
	assertEquals("sound2.mp3", my_looping_sound.soundLocation);
	assertEquals(true, my_looping_sound.looping);
	
	// trying to set the "looping" constructor argument shouldn't do anything
	var my_looping_sound2 = new my_looping_sound_class("sound3.mp3", false);
	assertEquals("sound3.mp3", my_looping_sound2.soundLocation);
	assertEquals(true, my_looping_sound2.looping);
	
	// notice how both ultimately refer to the Sound constructor
}

LNLTest.prototype.testIoCValues = function(){
	LNL.loadConfig({
		"lucky_number": {
			value: 7
		},
		"lucky_map": {
			value: {
				"color": "blue",
				"height": "tall"
			}
		},
		"unlucky_map": {
			value: {
				"color": "blue",
				"height": "tall"
			},
			lifecycle: "prototype" // can't do this!
		}
	});
	
	// primitive types are prototypes
	var number = LNL.$("lucky_number");
	assertEquals(7, number);
	var number2 = LNL.$("lucky_number");
	number2++;
	assertEquals(8, number2);
	assertEquals(7, number);
	
	// complex types are singletons
	var map = LNL.$("lucky_map");
	assertEquals("blue", map.color);
	var map2 = LNL.$("lucky_map");
	map2.color = "red";
	assertEquals("red", map.color)
	
	try {
		var proto_map = LNL.$("unlucky_map");
		fail("prototype maps shouldn't work");
	} 
	catch (e) {
		assertTrue(!!e.message.match("value specs can't specify lifecycle"));
	}
}