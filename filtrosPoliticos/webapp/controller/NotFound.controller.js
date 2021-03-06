sap.ui.define([
		"com/cpfl/filtrospoliticos/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("com.cpfl.filtrospoliticos.controller.NotFound", {

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