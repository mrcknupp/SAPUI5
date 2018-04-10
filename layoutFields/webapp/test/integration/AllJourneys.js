jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/layout/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/layout/test/integration/pages/Worklist",
		"com/cpfl/layout/test/integration/pages/Object",
		"com/cpfl/layout/test/integration/pages/NotFound",
		"com/cpfl/layout/test/integration/pages/Browser",
		"com/cpfl/layout/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.layout.view."
	});

	sap.ui.require([
		"com/cpfl/layout/test/integration/WorklistJourney",
		"com/cpfl/layout/test/integration/ObjectJourney",
		"com/cpfl/layout/test/integration/NavigationJourney",
		"com/cpfl/layout/test/integration/NotFoundJourney",
		"com/cpfl/layout/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});