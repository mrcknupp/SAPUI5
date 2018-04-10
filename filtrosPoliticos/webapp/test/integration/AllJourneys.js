jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/filtrospoliticos/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/filtrospoliticos/test/integration/pages/Worklist",
		"com/cpfl/filtrospoliticos/test/integration/pages/Object",
		"com/cpfl/filtrospoliticos/test/integration/pages/NotFound",
		"com/cpfl/filtrospoliticos/test/integration/pages/Browser",
		"com/cpfl/filtrospoliticos/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.filtrospoliticos.view."
	});

	sap.ui.require([
		"com/cpfl/filtrospoliticos/test/integration/WorklistJourney",
		"com/cpfl/filtrospoliticos/test/integration/ObjectJourney",
		"com/cpfl/filtrospoliticos/test/integration/NavigationJourney",
		"com/cpfl/filtrospoliticos/test/integration/NotFoundJourney",
		"com/cpfl/filtrospoliticos/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});