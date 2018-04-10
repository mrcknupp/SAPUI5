jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/cpfl/restricao/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/cpfl/restricao/test/integration/pages/Worklist",
		"com/cpfl/restricao/test/integration/pages/Object",
		"com/cpfl/restricao/test/integration/pages/NotFound",
		"com/cpfl/restricao/test/integration/pages/Browser",
		"com/cpfl/restricao/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.cpfl.restricao.view."
	});

	sap.ui.require([
		"com/cpfl/restricao/test/integration/WorklistJourney",
		"com/cpfl/restricao/test/integration/ObjectJourney",
		"com/cpfl/restricao/test/integration/NavigationJourney",
		"com/cpfl/restricao/test/integration/NotFoundJourney",
		"com/cpfl/restricao/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});