jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 MotivoOdata in the list

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/cpfl/motivorestricao/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/cpfl/motivorestricao/test/integration/pages/App",
	"com/cpfl/motivorestricao/test/integration/pages/Browser",
	"com/cpfl/motivorestricao/test/integration/pages/Master",
	"com/cpfl/motivorestricao/test/integration/pages/Detail",
	"com/cpfl/motivorestricao/test/integration/pages/Create",
	"com/cpfl/motivorestricao/test/integration/pages/NotFound"
], function(Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.motivorestricao.view."
	});

	sap.ui.require([
		"com/cpfl/motivorestricao/test/integration/MasterJourney",
		"com/cpfl/motivorestricao/test/integration/NavigationJourney",
		"com/cpfl/motivorestricao/test/integration/NotFoundJourney",
		"com/cpfl/motivorestricao/test/integration/BusyJourney",
		"com/cpfl/motivorestricao/test/integration/FLPIntegrationJourney"
	], function() {
		QUnit.start();
	});
});