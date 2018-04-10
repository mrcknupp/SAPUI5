jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/distrib/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/distrib/test/integration/pages/Worklist",
		"com/cpfl/distrib/test/integration/pages/Object",
		"com/cpfl/distrib/test/integration/pages/NotFound",
		"com/cpfl/distrib/test/integration/pages/Browser",
		"com/cpfl/distrib/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.distrib.view."
	});

	sap.ui.require([
		"com/cpfl/distrib/test/integration/WorklistJourney",
		"com/cpfl/distrib/test/integration/ObjectJourney",
		"com/cpfl/distrib/test/integration/NavigationJourney",
		"com/cpfl/distrib/test/integration/NotFoundJourney",
		"com/cpfl/distrib/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});