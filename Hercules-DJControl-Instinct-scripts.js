function HCInstinct() {}


// ----------   Global variables    ---------- 
HCInstinct.scratching = [false, false];
// ----------   Functions    ----------

// called when the MIDI device is opened & set up
HCInstinct.init = function(id, debugging) {	
	HCInstinct.id = id;
	HCInstinct.FastPosition=[0,0];
	HCInstinct.jogFastPosition=[0,0];

	HCInstinct.allLedOff();

	// Switch-on some LEDs for improve the usability
	midi.sendShortMsg(0x90, 46, 0x7F);	// Automix LED
	midi.sendShortMsg(0x90, 14, 0x7F);	// Cue deck A LED
	midi.sendShortMsg(0x90, 34, 0x7F);	// Cue deck B LED
	print ("***** Hercules DJ Instinct Control id: \""+id+"\" initialized.");
}

// Called when the MIDI device is closed
HCInstinct.shutdown = function(id) {
	HCInstinct.allLedOff();
	print ("***** Hercules DJ Instinct Control id: \""+id+"\" shutdown.");	
}


// === MISC TO MANAGE LEDS ===
HCInstinct.allLedOff = function () {
	// Switch off all LEDs
}		


// The button that enables/disables scratching
HCInstinct.wheelTouch0 = function (channel, control, value, status) {

    if (value == 0x7F && !HCInstinct.scratching[0]) { // catch only first touch
       var alpha = 1.0/8;
       var beta = alpha/32;
       engine.scratchEnable(1, 128, 33+1/3, alpha, beta);
       // Keep track of whether we're scratching on this virtual deck
       HCInstinct.scratching[0] = true;
    }
    else {    //  button up
        engine.scratchDisable(1);
        HCInstinct.scratching[0] = false;
    }

}
// The button that enables/disables scratching
HCInstinct.wheelTouch1 = function (channel, control, value, status) {

    if (value == 0x7F && !HCInstinct.scratching[1]) { // catch only first touch
       var alpha = 1.0/8;
       var beta = alpha/32;
       engine.scratchEnable(2, 128, 33+1/3, alpha, beta);
       // Keep track of whether we're scratching on this virtual deck
       HCInstinct.scratching[1] = true;

    }
    else {    //  button up
        engine.scratchDisable(2);
        HCInstinct.scratching[1] = false;
    }

}

 
HCInstinct.wheelTurn0 = function (channel, control, value, status) {
    
	// See if we're on scratching.
	//if (HCInstinct.scratching[0] == false )  return;
   
	var newValue;
	if (value-64 > 0) newValue = value-128; // 7F, 7E, 7D
	else newValue = value;
	engine.scratchTick(1,newValue);

 }
HCInstinct.wheelTurn1 = function (channel, control, value, status) {
    
	// See if we're on scratching.
	if (HCInstinct.scratching[1] == false )  return;
   
	var newValue;
	if (value-64 > 0) newValue = value-128; // 7F, 7E, 7D
	else newValue = value;
	engine.scratchTick(2,newValue);

 }

