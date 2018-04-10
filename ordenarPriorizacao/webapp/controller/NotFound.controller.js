sap.ui.define([
		"com/cpfl/ordenarpriorizacao/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("com.cpfl.ordenarpriorizacao.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);