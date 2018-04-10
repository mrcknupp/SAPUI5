jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/cpfl/motivorestricao/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/cpfl/motivorestricao/test/integration/pages/App",
	"com/cpfl/motivorestricao/test/integration/pages/Browser",
	"com/cpfl/motivorestricao/test/integration/pages/Master",
	"com/cpfl/motivorestricao/test/integration/pages/Detail",
	"com/cpfl/motivorestricao/test/integration/pages/NotFound"
], function(Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.motivorestricao.view."
	});

	sap.ui.require([
		"com/cpfl/motivorestricao/test/integration/NavigationJourneyPhone",
		"com/cpfl/motivorestricao/test/integration/NotFoundJourneyPhone",
		"com/cpfl/motivorestricao/test/integration/BusyJourneyPhone"
	], function() {
		QUnit.start();
	});
});