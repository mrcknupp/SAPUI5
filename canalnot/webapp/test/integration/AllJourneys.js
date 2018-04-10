jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/canalnot/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/canalnot/test/integration/pages/Worklist",
		"com/cpfl/canalnot/test/integration/pages/Object",
		"com/cpfl/canalnot/test/integration/pages/NotFound",
		"com/cpfl/canalnot/test/integration/pages/Browser",
		"com/cpfl/canalnot/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.canalnot.view."
	});

	sap.ui.require([
		"com/cpfl/canalnot/test/integration/WorklistJourney",
		"com/cpfl/canalnot/test/integration/ObjectJourney",
		"com/cpfl/canalnot/test/integration/NavigationJourney",
		"com/cpfl/canalnot/test/integration/NotFoundJourney",
		"com/cpfl/canalnot/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});