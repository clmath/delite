dojo.require("dojox.storage");
dojo.require("dojox.storage.Gears");


var TestStorage = {
	currentProvider: "default",
	currentNamespace: dojox.storage.DEFAULT_NAMESPACE,
	
	initialize: function(){
		//console.debug("test_storage.initialize()");
		
		// clear out old values and enable input forms
		dojo.byId("storageNamespace").value = this.currentNamespace;
		dojo.byId("storageNamespace").disabled = false;
		dojo.byId("storageKey").value = "";
		dojo.byId("storageKey").disabled = false;
		dojo.byId("storageValue").value = "";
		dojo.byId("storageValue").disabled = false;
		
		// write out our available namespaces
		this._printAvailableNamespaces();
		
		// write out our available keys
		this._printAvailableKeys();
		
		// initialize our event handlers
		var namespaceDirectory = dojo.byId("namespaceDirectory");
		dojo.connect(namespaceDirectory, "onchange", this, this.namespaceChange);
		var directory = dojo.byId("directory");
		dojo.connect(directory, "onchange", this, this.directoryChange);
		var storageValueElem = dojo.byId("storageValue");
		dojo.connect(storageValueElem, "onkeyup", this, this.printValueSize);
		
		// make the directory be unselected if the key name field gets focus
		var keyNameField = dojo.byId("storageKey");
		dojo.connect(keyNameField, "onfocus", function(evt){
			directory.selectedIndex = -1;
		}); 		
											 
		// add onclick listeners to all of our buttons
		var buttonContainer = dojo.byId("buttonContainer");
		var currentChild = buttonContainer.firstChild;
		while (currentChild.nextSibling != null){
			if (currentChild.nodeType == dojo.dom.ELEMENT_NODE){
				var buttonName = currentChild.id;
				var functionName = buttonName.match(/^(.*)Button$/)[1];
				dojo.connect(currentChild, "onclick", this, this[functionName]);
				currentChild.disabled = false;
			}		
			
			currentChild = currentChild.nextSibling;
		}
		
		// print out metadata
		this._printProviderMetadata();
		
		// disable the configuration button if none is supported for this provider
		if(dojox.storage.hasSettingsUI() == false){
			dojo.byId("configureButton").disabled = true;	
		}
	},
	
	namespaceChange: function(evt){
		var ns = evt.target.value;
		this.currentNamespace = ns;
		
		// update our available keys
		this._printAvailableKeys();
		
		// clear out our key and values
		dojo.byId("storageNamespace").value = this.currentNamespace;
		dojo.byId("storageKey").value = "";
		dojo.byId("storageValue").value = "";
	},
	
	directoryChange: function(evt){
		var key = evt.target.value;
		
		// add this value into the form
		var keyNameField = dojo.byId("storageKey");
		keyNameField.value = key;
		
		this._handleLoad(key);		
	},
	
	load: function(evt){
		// cancel the button's default behavior
		evt.preventDefault();
		evt.stopPropagation();
		
		// get the key to load
		var key = dojo.byId("storageKey").value;
		
		if(key == null || typeof key == "undefined" || key == ""){
			alert("Please enter a key name");
			return;
		}
		
		this._handleLoad(key);
	},
	
	save: function(evt){
		// cancel the button's default behavior
		evt.preventDefault();
		evt.stopPropagation();
		
		// get the new values
		var key = dojo.byId("storageKey").value;
		var value = dojo.byId("storageValue").value;
		var namespace = dojo.byId("storageNamespace").value;
		
		if(key == null || typeof key == "undefined" || key == ""){
			alert("Please enter a key name");
			return;
		}
		
		if(value == null || typeof value == "undefined" || value == ""){
			alert("Please enter a key value");
			return;
		}
		
		// print out the size of the value
		this.printValueSize(); 
		
		// do the save
		this._save(key, value, namespace);
	},
	
	clearNamespace: function(evt){
		// cancel the button's default behavior
		evt.preventDefault();
		evt.stopPropagation();
		
		dojox.storage.clear(this.currentNamespace);
		
		this._printAvailableNamespaces();
		this._printAvailableKeys();
	},
	
	configure: function(evt){
		// cancel the button's default behavior
		evt.preventDefault();
		evt.stopPropagation();
		
		if(dojox.storage.hasSettingsUI()){
			// redraw our keys after the dialog is closed, in
			// case they have all been erased
			var self = this;
			dojox.storage.onHideSettingsUI = function(){
				self._printAvailableKeys();
			}
			
			// show the dialog
			dojox.storage.showSettingsUI();
		}
	},
	
	remove: function(evt){
		// cancel the button's default behavior
		evt.preventDefault();
		evt.stopPropagation();
		
		// determine what key to delete; if the directory has a selected value,
		// use that; otherwise, use the key name field
		var directory = dojo.byId("directory");
		var keyNameField = dojo.byId("storageKey");
		var keyValueField = dojo.byId("storageValue");
		var key;
		if(directory.selectedIndex != -1){
			key = directory.value;
			// delete this option
			var options = directory.childNodes;
			for(var i = 0; i < options.length; i++){
				if(options[i].nodeType == dojo.dom.ELEMENT_NODE &&
					 options[i].value == key){
					directory.removeChild(options[i]);
					break;
				}
			}
		}else{
			key = keyNameField.value;
		}
		
		keyNameField.value = "";
		keyValueField.value = "";
		
		// now delete the value
		this._printStatus("Removing '" + key + "'...");
		if(this.currentNamespace == dojox.storage.DEFAULT_NAMESPACE){
			dojox.storage.remove(key);
		}else{
			dojox.storage.remove(key, this.currentNamespace);
		}
		
		// update our UI
		this._printAvailableNamespaces();
		this._printStatus("Removed '" + key);
	},
	
	printValueSize: function(){
		var storageValue = dojo.byId("storageValue").value;
		var size = 0;
		if(storageValue != null && !dojo.lang.isUndefined(storageValue)){
			size = storageValue.length;
		}
		
		// determine the units we are dealing with
		var units;
		if(size < 1024)
			units = " bytes";
		else{
			units = " K";
			size = size / 1024;
			size = Math.round(size);
		}
		
		size = size + units;
		
		var valueSize = dojo.byId("valueSize");
		valueSize.innerHTML = size;
	},
	
	saveBook: function(evt){
		this._printStatus("Loading book...");
		
		var d = new dojo.Deferred();
		dojo.xhrGet({
			url: "resources/testBook.txt",
			handleAs: "text"
		});
		
		d.addCallback(dojo.hitch(this, function(type, data, evt){
			this._printStatus("Book loaded");
			this._save("testBook", data);
		}));
		
		d.addErrback(dojo.hitch(this, function(type, error){ 
			alert("Unable to load testBook.txt");
		}));
		
		if(!dojo.lang.isUndefined(evt) && evt != null){
			evt.preventDefault();
			evt.stopPropagation();
		}
		
		return false;
	},
	
	saveXML: function(evt){
		this._printStatus("Loading XML...");
		
		var d = new dojo.Deferred();
		dojo.xhrGet({
			url: "resources/testXML.xml",
			handleAs: "text"
		});
		
		d.addCallback(dojo.hitch(this, function(type, data, evt){
			this._printStatus("XML loaded");
			this._save("testXML", data);
		}));
		
		d.addErrback(dojo.hitch(this, function(type, error){ 
			alert("Unable to load testXML.xml");
		}));
		
		if(!dojo.lang.isUndefined(evt) && evt != null){
			evt.preventDefault();
			evt.stopPropagation();
		}
		
		return false;
	},
	
	_save: function(key, value, namespace){
		this._printStatus("Saving '" + key + "'...");
		var self = this;
		var saveHandler = function(status, keyName){
			if(status == dojox.storage.FAILED){
				alert("You do not have permission to store data for this web site. "
			        + "Press the Configure button to grant permission.");
			}else if(status == dojox.storage.SUCCESS){
				// clear out the old value
				dojo.byId("storageKey").value = "";
				dojo.byId("storageValue").value = "";
				self._printStatus("Saved '" + key + "'");
				
				if(typeof namespace != "undefined"
					&& namespace != null){
					self.currentNamespace = namespace;
				}
				
				// update the list of available keys and namespaces
				// put this on a slight timeout, because saveHandler is called back
				// from Flash, which can cause problems in Flash 8 communication
				// which affects Safari
				// FIXME: Find out what is going on in the Flash 8 layer and fix it
				// there
				window.setTimeout(function(){ 
					self._printAvailableKeys();
					self._printAvailableNamespaces();
				}, 1);
			}
		};
		
		try{
			if(namespace == dojox.storage.DEFAULT_NAMESPACE){
				dojox.storage.put(key, value, saveHandler);
			}else{
				dojox.storage.put(key, value, saveHandler, namespace);
			}
		}catch(exp){
			alert(exp);
		}
	},
	
	_printAvailableKeys: function(){
		var directory = dojo.byId("directory");
		
		// clear out any old keys
		directory.innerHTML = "";
		
		// add new ones
		var availableKeys;
		if(this.currentNamespace == dojox.storage.DEFAULT_NAMESPACE){
			availableKeys = dojox.storage.getKeys();
		}else{
			availableKeys = dojox.storage.getKeys(this.currentNamespace);
		}
		
		for (var i = 0; i < availableKeys.length; i++){
			var optionNode = document.createElement("option");
			optionNode.appendChild(document.createTextNode(availableKeys[i]));
			optionNode.value = availableKeys[i];
			directory.appendChild(optionNode);
		}
	},
	
	_printAvailableNamespaces: function(){
		var namespacesDir = dojo.byId("namespaceDirectory");
		
		// clear out any old namespaces
		namespacesDir.innerHTML = "";
		
		// add new ones
		var availableNamespaces = dojox.storage.getNamespaces();
		
		for (var i = 0; i < availableNamespaces.length; i++){
			var optionNode = document.createElement("option");
			optionNode.appendChild(document.createTextNode(availableNamespaces[i]));
			optionNode.value = availableNamespaces[i];
			namespacesDir.appendChild(optionNode);
		}
	},
	
	_handleLoad: function(key){
		this._printStatus("Loading '" + key + "'...");
		
		// get the value
		var results;
		if(this.currentNamespace == dojox.storage.DEFAULT_NAMESPACE){
			results = dojox.storage.get(key);
		}else{
			results = dojox.storage.get(key, this.currentNamespace);
		}
		
		// jsonify it if it is a JavaScript object
		if(typeof results != "string"){
			results = dojo.toJson(results);
		}
		
		// print out its value
		this._printStatus("Loaded '" + key + "'");
		dojo.byId("storageValue").value = results;
		
		// print out the size of the value
		this.printValueSize(); 
	},
	
	_printProviderMetadata: function(){
		var storageType = dojox.storage.getType();
		var isSupported = dojox.storage.isAvailable();
		var maximumSize = dojox.storage.getMaximumSize();
		var permanent = dojox.storage.isPermanent();
		var uiConfig = dojox.storage.hasSettingsUI();
		var moreInfo = "";
		if(dojox.storage.getType() == "dojox.storage.FlashStorageProvider"){
			moreInfo = "Flash Comm Version " + dojo.flash.info.commVersion;
		}
		
		dojo.byId("currentStorageProvider").innerHTML = storageType;
		dojo.byId("isSupported").innerHTML = isSupported;
		dojo.byId("isPersistent").innerHTML = permanent;
		dojo.byId("hasUIConfig").innerHTML = uiConfig;
		dojo.byId("maximumSize").innerHTML = maximumSize;
		dojo.byId("moreInfo").innerHTML = moreInfo;
	},
	
	_printStatus: function(message){
		// remove the old status
		var top = dojo.byId("top");
		for (var i = 0; i < top.childNodes.length; i++){
			var currentNode = top.childNodes[i];
			if (currentNode.nodeType == 1 &&
					currentNode.className == "status"){
				top.removeChild(currentNode);
			}		
		}
		
		var status = document.createElement("span");
		status.className = "status";
		status.innerHTML = message;
		
		top.appendChild(status);
		dojo.fadeOut({nodes: status, duration: 2000}).play();
	}
};

// wait until the storage system is finished loading
if(dojox.storage.manager.isInitialized() == false){ // storage might already be loaded when we get here
	dojo.connect(dojox.storage.manager, "loaded", TestStorage, TestStorage.initialize);
}else{
	dojo.connect(dojo, "loaded", TestStorage, TestStorage.initialize);
}
