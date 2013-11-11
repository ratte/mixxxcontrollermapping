function HCInstinct() {};



// ----------   Global variables    ---------- 
HCInstinct.scratching = [false, false];
HCInstinct.vinylButton = false;			
HCInstinct.pitchSwitches = new Array();
HCInstinct.pitchSwitches["A"] = [0,0];
HCInstinct.pitchSwitches["B"] = [0,0];
HCInstinct.headPhoneVolButtons = [false,false];
HCInstinct.headPhoneDoublepressed = false;	
// ----------   Functions    ----------

// called when the MIDI device is opened & set up
HCInstinct.init = function(id, debugging) {	
	HCInstinct.id = id;
	HCInstinct.FastPosition=[0,0];
	HCInstinct.jogFastPosition=[0,0];

	HCInstinct.allLedOff();
	HCInstinct.testLeds();
	print ("***** Hercules DJ Instinct Control id: \""+id+"\" initialized. ***** ");
};


// Called when the MIDI device is closed
HCInstinct.shutdown = function(id) {
	HCInstinct.allLedOff();
	print ("***** Herculhex es DJ Instinct Control id: \""+id+"\" shutdown.");	
};


// === MISC TO MANAGE LEDS ===


// Switch off all LEDs
HCInstinct.allLedOff = function () {
	for (var i = 0; i <= 127; i++) {
	  midi.sendShortMsg(0x90, i, 0x00);
	};
};


//sets all LED's for testing
HCInstinct.testLeds = function () {
	// LEDS: x7F = on; 0x00 = OFF
	for (var i = 0; i <= 255; i++) {
	  midi.sendShortMsg(0x90, i, 0x7F);
	};
};



// Use VinylButton as "Shift"-Button
HCInstinct.vinylButtonHandler = function(channel,control, value, status) {
    if (value == ButtonState.pressed) {
	HCInstinct.vinylButton = true;
    }
    else {
	HCInstinct.vinylButton=false;
    };
};


// The button that enables/disables 
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
    };

};
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

};

 
HCInstinct.wheelTurn0 = function (channel, control, value, status) {
	var newValue;
	if (value-64 > 0) newValue = value-128; // 7F, 7E, 7D
	else newValue = value;
	engine.scratchTick(1,newValue);
};

HCInstinct.wheelTurn1 = function (channel, control, value, status) {
    
	// See if we're on scratching.
	if (HCInstinct.scratching[1] == false )  return;
   
	var newValue;
	if (value-64 > 0) newValue = value-128; // 7F, 7E, 7D
	else newValue = value;
	engine.scratchTick(2,newValue);
};

HCInstinct.knobIncrement = function (group, action, minValue, maxValue, centralValue, step, sign) {
	// This function allows you to increment a non-linear value like the volume's knob
	// sign must be 1 for positive increment, -1 for negative increment
	semiStep = step/2;
	rangeWidthLeft = centralValue-minValue;
	rangeWidthRight = maxValue-centralValue;
	actual = engine.getValue(group, action);
	
	if (actual < 1){
		increment = ((rangeWidthLeft)/semiStep)*sign;
	}
	else if (actual > 1){
		increment = ((rangeWidthRight)/semiStep)*sign;
	}
	else if (actual == 1){
		increment = (sign == 1) ? rangeWidthRight/semiStep : (rangeWidthLeft/semiStep)*sign;
	}

	if (sign == 1 && actual < maxValue){
		newValue = actual + increment;
	}
	else if (sign == -1 && actual > minValue){
		newValue = actual + increment;
	}
	
	return newValue;
};



// Pitch +/- 
HCInstinct.pitch = function (midino, control, value, status, group) {
	var speed = (HCInstinct.vinylButton == true) ? "" : "_small";
	var state = (value == 0x7F) ? 1 : 0;
	switch (control){
		case 0x11: HCInstinct.pitchSwitches["A"][0]=state;
			engine.setValue(group, "rate_temp_down"+speed, state); 
			break;
		case 0x12: HCInstinct.pitchSwitches["A"][1]=state;
			engine.setValue(group, "rate_temp_up"+speed, state); 
			break;
		case 0x2B: HCInstinct.pitchSwitches["B"][0]=state;
			engine.setValue(group, "rate_temp_down"+speed, state); 
			break;
		case 0x2C: HCInstinct.pitchSwitches["B"][1]=state;
			engine.setValue(group, "rate_temp_up"+speed, state); 
			break;
	};	
        // when buttons + and - pressed simultanously
        if (HCInstinct.pitchSwitches["A"][0] && HCInstinct.pitchSwitches["A"][1]) {
		// reset pitch to 0
		engine.setValue(group, "rate", 0); 
	};
        if (HCInstinct.pitchSwitches["B"][0] && HCInstinct.pitchSwitches["B"][1]) {
		engine.setValue(group, "rate", 0); 
	}
};

// Up/Down-Siwtches 
HCInstinct.tempPitch = function (midino, control, value, status, group) {
	var rate = (value==0x7F) ? "rate_perm_down" : "rate_perm_up" ;
	if (HCInstinct.vinylButton == false) {
		rate = rate + "_small";
	}	
	engine.setValue(group, rate, 1);
	engine.setValue(group, rate, 0);
};



// Cue Buttons Handling (Erase Cue-Points together with "Vinyl")
HCInstinct.cueButtons = function (midino, control, value, status, group) {
	//var state = (value == 0x7F) ? 1 : 0;
        var act = (HCInstinct.vinylButton == true) ? "clear" : "activate";
	switch (control){
		case 0x0D: 
			engine.setValue(group, "hotcue_1_"+ act); 
			break;
		case 0x0E: 
			engine.setValue(group, "hotcue_2_"+ act); 
			break;
		case 0x0F:
			engine.setValue(group, "hotcue_3_"+ act); 
			break;
		case 0x10:  
			engine.setValue(group, "hotcue_4_"+ act); 
			break;
		case 0x27:
		case 0x28:    
		case 0x29:  		
		case 0x2A:  
	
	};
	print ("act:"+act+ " control:"+control);

};

// Headphone Buttons
// '+' and '-' simultanously switches betwon Zero// Full Volume
HCInstinct.headPhone = function (midino, control, value, status) {
	var headVol = engine.getValue("[Master]","headVolume");
	var stepwidth = 0.2;

	if (control == 0x40) { 
		// '-' Button
		if (value ==0x00){ // Button released after pushing
			if (!HCInstinct.headPhoneDoublepressed)
				headVol -= stepwidth;
			if (headVol <0) 	headVol =0.0;
			HCInstinct.headPhoneVolButtons[0] = false;
		} else {
			HCInstinct.headPhoneVolButtons[0] = true;
		}
	};	
	if (control == 0x41){ 
		// '+' Button
		if (value ==0x00){				
			if (!HCInstinct.headPhoneDoublepressed)
				headVol += stepwidth;
			if (headVol >=5)	          headVol = 5;
			HCInstinct.headPhoneVolButtons[1] = false;
		} else {
			HCInstinct.headPhoneVolButtons[1] = true;
		};
	};	
	
	if (!HCInstinct.headPhoneVolButtons[0] && !HCInstinct.headPhoneVolButtons[1]){
	        HCInstinct.headPhoneDoublepressed = false;
	}
	
	// + and - buttons pressed simultanously
	if (HCInstinct.headPhoneVolButtons[0]== true && HCInstinct.headPhoneVolButtons[1] == true){
		if (headVol <= 0.0+ stepwidth)	headVol = 5.0;
		else if (headVol <= 1.0)	headVol = 0.0;
		else if (headVol = 5.0)  headVol = 0.0;
		else if (headVol > 1.0)  headVol = 5.0;
	        HCInstinct.headPhoneDoublepressed = true;
	};
	
	engine.setValue("[Master]", "headVolume", headVol); 
}
