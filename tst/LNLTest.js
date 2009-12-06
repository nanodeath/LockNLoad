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
	LNL.loadJSON({
	    "censor_function": {
	        "function": SimpleCensor,
	        args: ["_", ['darn', 'dang', 'fudge', 'phooie']] // _ arguments will be merged into this
	    }
	});
	
	var my_wimpy_censor_function = LNL.$("censor_function");
	assertEquals("**** it, stop doing that you **** kids!", my_wimpy_censor_function("Darn it, stop doing that you dang kids!"));
}

LNLTest.prototype.testIoCObject = function(){
	LNL.loadJSON({
	    "celebratory_object": {
	        "class": "Confetti",
	        props: { // properties -- variables and methods to set
	            "color": "red", // sets your_object.color = "red"
	            "quantity()": 20 // calls your_object.setQuantity(20) 
	        }
	    }
	});
	
	var my_celebratory_object = LNL.$("celebratory_object");
	
	assertEquals("red", my_celebratory_object.color)
	assertEquals(20, my_celebratory_object.getQuantity())
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
}

LNLTest.prototype.testIoCSingleton = function(){
	LNL.loadJSON({
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
	LNL.loadJSON({
		"celebratory_clone": {
			"class": "Confetti",
			type: "prototype",
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
