sap.ui.define([
"sap/ui/core/mvc/Controller"
], function(Controller) {
"use strict";

return Controller.extend("tab.ZMTable.controller.BaseController", {
	/**
	 * Convenience method for accessing the router.
	 * @public
	 * @returns {sap.ui.core.routing.Router} the router for this component
	 */
	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},

	/**
	 * Convenience method for getting the view model by name.
	 * @public
	 * @param {string} [sName] the model name
	 * @returns {sap.ui.model.Model} the model instance
	 */
	getModel: function(sName) {
		return this.getView().getModel(sName);
	},

	_import: function(file) {
		if (file && window.FileReader) {
			var reader = new FileReader();
			var that = this;
			reader.onload = function(evt) {
				var data = evt.target.result;
				//var xlsx = XLSX.read(data, {type: 'binary'});
				var CHUNK_SIZE = 0x8000; // arbitrary number here, not too small, not too big
				var index = 0;
				var array = new Uint8Array(data);
				var length = array.length;
				var arr = '';
				var slice1;
				while (index < length) {
					slice1 = array.subarray(index, Math.min(index + CHUNK_SIZE, length)); // `Math.min` is not really necessary here I think
					arr += String.fromCharCode.apply(null, slice1);
					index += CHUNK_SIZE;
				}
				try {
					var xlsx = XLSX.read(btoa(arr), {
						type: 'base64'
					});
				} catch (err) {
					sap.m.MessageBox.show("Failed to Load", {
						title: "Error",
						styleClass: "sapUiSizeCompact messageBox",
						icon: sap.m.MessageBox.Icon.ERROR,
						actions: [sap.m.MessageBox.Action.OK]
					});
					return false;
				}

				var result = xlsx.Strings;
				result = {};
				var sheet = xlsx.SheetNames[0];
				// xlsx.Sheets[xlsx.SheetNames[0]]['!ref'] = "A1:F10";
				xlsx.SheetNames.forEach(function(sheetName) {
					var rObjArr = XLSX.utils
						.sheet_to_row_object_array(xlsx.Sheets[sheetName]);
					if (rObjArr.length > 0) {
						result[sheetName] = rObjArr;
					}
				});
				var sheetData = result[sheet];
				if (sheetData === undefined) {
					sap.m.MessageBox.show("Error While Uploading", {
						title: "Error",
						styleClass: "sapUiSizeCompact messageBox",
						icon: sap.m.MessageBox.Icon.ERROR,
						actions: [sap.m.MessageBox.Action.OK]
					});
					that.getView().byId("fileUploader").setValue("");
					return false;
				}
				that._creatobjPy(sheetData);

			};
			reader.readAsArrayBuffer(file);
		}
	},


/**
 * Convenience method for setting the view model.
 * @public
 * @param {sap.ui.model.Model} oModel the model instance
 * @param {string} sName the model name
 * @returns {sap.ui.mvc.View} the view instance
 */
setModel: function(oModel, sName) {
		return this.getView().setModel(oModel, sName);
	},

	/**
	 * Getter for the resource bundle.
	 * @public
	 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
	 */
	getResourceBundle: function() {
		return this.getOwnerComponent().getModel("i18n").getResourceBundle();
	},

	/**
	 * Event handler when the share by E-Mail button has been clicked
	 * @public
	 */
	onShareEmailPress: function() {
		var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
		sap.m.URLHelper.triggerEmail(
			null,
			oViewModel.getProperty("/shareSendEmailSubject"),
			oViewModel.getProperty("/shareSendEmailMessage")
		);
	},

	/**
	 * Adds a history entry in the FLP page history
	 * @public
	 * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
	 * @param {boolean} bReset If true resets the history before the new entry is added
	 */
	addHistoryEntry: (function() {
		var aHistoryEntries = [];

		return function(oEntry, bReset) {
			if (bReset) {
				aHistoryEntries = [];
			}

			var bInHistory = aHistoryEntries.some(function(entry) {
				return entry.intent === oEntry.intent;
			});

			if (!bInHistory) {
				aHistoryEntries.push(oEntry);
				this.getOwnerComponent().getService("ShellUIService").then(function(oService) {
					oService.setHierarchy(aHistoryEntries);
				});
			}
		};
	})()
});

}
);