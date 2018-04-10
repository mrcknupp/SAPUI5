jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 layout_Odata in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/cpfl/layout/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/cpfl/layout/test/integration/pages/App",
	"com/cpfl/layout/test/integration/pages/Browser",
	"com/cpfl/layout/test/integration/pages/Master",
	"com/cpfl/layout/test/integration/pages/Detail",
	"com/cpfl/layout/test/integration/pages/Create",
	"com/cpfl/layout/test/integration/pages/NotFound"
], function(Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.layout.view."
	});

	sap.ui.require([
		"com/cpfl/layout/test/integration/MasterJourney",
		"com/cpfl/layout/test/integration/NavigationJourney",
		"com/cpfl/layout/test/integration/NotFoundJourney",
		"com/cpfl/layout/test/integration/BusyJourney",
		"com/cpfl/layout/test/integration/FLPIntegrationJourney"
	], function() {
		QUnit.start();
	});
});