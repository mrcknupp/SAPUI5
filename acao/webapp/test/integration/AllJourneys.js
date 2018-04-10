jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"acao/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"acao/test/integration/pages/Worklist",
		"acao/test/integration/pages/Object",
		"acao/test/integration/pages/NotFound",
		"acao/test/integration/pages/Browser",
		"acao/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "acao.view."
	});

	sap.ui.require([
		"acao/test/integration/WorklistJourney",
		"acao/test/integration/ObjectJourney",
		"acao/test/integration/NavigationJourney",
		"acao/test/integration/NotFoundJourney",
		"acao/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});