sap.ui.define([
		"com/cpfl/layout/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("com.cpfl.layout.controller.NotFound", {

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