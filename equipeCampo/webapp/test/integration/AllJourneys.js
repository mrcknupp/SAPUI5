jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/equipecampo/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/equipecampo/test/integration/pages/Worklist",
		"com/cpfl/equipecampo/test/integration/pages/Object",
		"com/cpfl/equipecampo/test/integration/pages/NotFound",
		"com/cpfl/equipecampo/test/integration/pages/Browser",
		"com/cpfl/equipecampo/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.equipecampo.view."
	});

	sap.ui.require([
		"com/cpfl/equipecampo/test/integration/WorklistJourney",
		"com/cpfl/equipecampo/test/integration/ObjectJourney",
		"com/cpfl/equipecampo/test/integration/NavigationJourney",
		"com/cpfl/equipecampo/test/integration/NotFoundJourney",
		"com/cpfl/equipecampo/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});