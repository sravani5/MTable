sap.ui.define([
		"tab/ZMTable/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("tab.ZMTable.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);