jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"com/cpfl/layout/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/cpfl/layout/test/integration/pages/App",
	"com/cpfl/layout/test/integration/pages/Browser",
	"com/cpfl/layout/test/integration/pages/Master",
	"com/cpfl/layout/test/integration/pages/Detail",
	"com/cpfl/layout/test/integration/pages/NotFound"
], function(Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.layout.view."
	});

	sap.ui.require([
		"com/cpfl/layout/test/integration/NavigationJourneyPhone",
		"com/cpfl/layout/test/integration/NotFoundJourneyPhone",
		"com/cpfl/layout/test/integration/BusyJourneyPhone"
	], function() {
		QUnit.start();
	});
});