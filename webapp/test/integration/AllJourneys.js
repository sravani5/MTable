/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"tab/ZMTable/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"tab/ZMTable/test/integration/pages/Worklist",
	"tab/ZMTable/test/integration/pages/Object",
	"tab/ZMTable/test/integration/pages/NotFound",
	"tab/ZMTable/test/integration/pages/Browser",
	"tab/ZMTable/test/integration/pages/App"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "tab.ZMTable.view."
	});

	sap.ui.require([
		"tab/ZMTable/test/integration/WorklistJourney",
		"tab/ZMTable/test/integration/ObjectJourney",
		"tab/ZMTable/test/integration/NavigationJourney",
		"tab/ZMTable/test/integration/NotFoundJourney",
		"tab/ZMTable/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});