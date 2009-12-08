LNLTestLoader = TestCase("LNLTestLoader");

LNLTestLoader.prototype.setUp = function(){
	LNL.reset();
	
	this.config1 = {
		"foo": {
			value: 20
		},
		"bar": {
			value: 400
		}
	};
	this.config2 = {
		"bar": {
			value: 8000
		},
		"baz": {
			value: 160000
		}
		
	};
}

LNLTestLoader.prototype.testOverwriteDefaultSad = function(){
	LNL.loadConfig(this.config1);
	try{
		LNL.loadConfig(this.config2);
	} catch(e){
		assertTrue("message was " + e.message, !!e.message.match("id conflict"));
		return;
	}
	fail("Should have failed when loading the second config");
};

LNLTestLoader.prototype.testOverwriteDefaultHappy = function(){
	delete this.config2.bar;
	
	LNL.loadConfig(this.config1);
	LNL.loadConfig(this.config2);
	
	assertEquals(20, LNL.$("foo"));
	assertEquals(400, LNL.$("bar"));
	assertEquals(160000, LNL.$("baz"));
};

LNLTestLoader.prototype.testOverwriteIgnore = function(){
	LNL.loadConfig(this.config1);
	LNL.loadConfig(this.config2, LNL.OVERWRITE.IGNORE);
	
	assertEquals(20, LNL.$("foo"));
	assertEquals(8000, LNL.$("bar"));
	assertEquals(160000, LNL.$("baz"));
};

LNLTestLoader.prototype.testOverwriteSkip = function(){
	LNL.loadConfig(this.config1);
	LNL.loadConfig(this.config2, LNL.OVERWRITE.SKIP);
	
	assertEquals(20, LNL.$("foo"));
	assertEquals(400, LNL.$("bar"));
	assertEquals(160000, LNL.$("baz"));
};