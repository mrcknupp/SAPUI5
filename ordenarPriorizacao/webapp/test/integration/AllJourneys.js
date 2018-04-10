jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/ordenarpriorizacao/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/ordenarpriorizacao/test/integration/pages/Worklist",
		"com/cpfl/ordenarpriorizacao/test/integration/pages/Object",
		"com/cpfl/ordenarpriorizacao/test/integration/pages/NotFound",
		"com/cpfl/ordenarpriorizacao/test/integration/pages/Browser",
		"com/cpfl/ordenarpriorizacao/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.ordenarpriorizacao.view."
	});

	sap.ui.require([
		"com/cpfl/ordenarpriorizacao/test/integration/WorklistJourney",
		"com/cpfl/ordenarpriorizacao/test/integration/ObjectJourney",
		"com/cpfl/ordenarpriorizacao/test/integration/NavigationJourney",
		"com/cpfl/ordenarpriorizacao/test/integration/NotFoundJourney",
		"com/cpfl/ordenarpriorizacao/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});