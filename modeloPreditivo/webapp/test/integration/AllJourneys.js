jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/modelos/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/modelos/test/integration/pages/Worklist",
		"com/cpfl/modelos/test/integration/pages/Object",
		"com/cpfl/modelos/test/integration/pages/NotFound",
		"com/cpfl/modelos/test/integration/pages/Browser",
		"com/cpfl/modelos/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.modelos.view."
	});

	sap.ui.require([
		"com/cpfl/modelos/test/integration/WorklistJourney",
		"com/cpfl/modelos/test/integration/ObjectJourney",
		"com/cpfl/modelos/test/integration/NavigationJourney",
		"com/cpfl/modelos/test/integration/NotFoundJourney",
		"com/cpfl/modelos/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});