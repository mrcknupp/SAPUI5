sap.ui.define([
	"com/cpfl/modelos/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"com/cpfl/modelos/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator) {
	"use strict";
	return BaseController.extend("com.cpfl.modelos.controller.Worklist", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */

		onInit: function() {
			var oViewModel, iOriginalBusyDelay, oTable = this.byId("table");
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._oTableSearchState = [];
			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				//ssaveAsTileTitle: this.getResourceBundle().getText("worklistViewTitle"),
				//shareOnJamTitle: this.getResourceBundle().getText("worklistViewTitle"),
				//shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				//shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle, oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},
		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},
		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var oTableSearchState = [];
				var sQuery = oEvent.getParameter("query");
				if (sQuery && sQuery.length > 0) {
					oTableSearchState = [new Filter("NAME", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(oTableSearchState);
			}
		},
		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
	//		this.getRouter().navTo("object",{ 
				var PREDICTIVE_MODEL_ID = oItem.getBindingContext().getProperty("PREDICTIVE_MODEL_ID"); 
				var VALID_FROM = oItem.getBindingContext().getProperty("VALID_FROM");
				var key = PREDICTIVE_MODEL_ID + "#" + VALID_FROM; 
			//	});
			this.getRouter().navTo("object", {
				objectId: key
			});
		},
		/**
		 * Create new restriction
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_createObject: function() {
			this.getRouter().navTo("object", {
				objectId : "Create"
			});
		},
		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {object} oTableSearchState an array of filters for the search
		 * @private
		 */
		_applySearch: function(oTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(oTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (oTableSearchState.length !== 0) {
				oTableSearchState = [];
			} else {	
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},
		/**
		 *@memberOf com.cpfl.modelos.controller.Worklist
		 */
		onCreate: function(oEvent) {
			//This code was generated by the layout editor.
			this._createObject();
		},
		/**
		 *@memberOf com.cpfl.modelos.controller.Worklist
		 *Hide options of filters
		 */
		onSwitch: function() {
			//This code was generated by the layout editor.
			var status = this.getView().byId("filterBox").getVisible();
			if (status === true) {
				this.getView().byId("filterBox").setVisible(false);
			} else {
				this.getView().byId("filterBox").setVisible(true);
			}
		},
		/**
		 *@memberOf com.cpfl.modelos.controller.Worklist
		 */
		onF4TypeModel: function(oEvent) {
			//This code was generated by the layout editor.
			var oInputTypeModel = this.getView().byId("idFiltroTipoModelo");
			var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idF4valueType_model", {
				title: this.getView().getModel("i18n").getResourceBundle().getText("type_model"),
				supportMultiselect: false,
			//	key: "PREDICTIVE_MODEL_SUBJECT_ID",
				descriptionKey: "NAME",
				ok: function(oControlEvent) {
					var aTokens = oControlEvent.getParameter("tokens");
					//oInputTypeModel.setValue().setTokens(aTokens);
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInputTypeModel.setValue(token.getText());
						//text: token.getText()
					}
					oValueHelpDialog.close();
				},

				cancel: function(oControlEvent) {
					oValueHelpDialog.close();
				},

				afterClose: function() {
					oValueHelpDialog.destroy();
				}
			});

			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: [{
					label: this.getView().getModel("i18n").getResourceBundle().getText("oTM_PREDICTIVE_MODEL_SUBJECT_ID"),
					template: "PREDICTIVE_MODEL_SUBJECT_ID"
				}, {
					label: this.getView().getModel("i18n").getResourceBundle().getText("oTM_Name"),
					template: "NAME"
				}]
			});

			oValueHelpDialog.getTable().setModel(oColModel, "columns");
			oValueHelpDialog.getTable().setModel(this.getModel());
			oValueHelpDialog.getTable().bindRows("/tipoModeloPreditivoOData");
			oValueHelpDialog.open();
			oValueHelpDialog.update();
			oValueHelpDialog.addStyleClass("sapUiSizeCozy");

		},

		onFilter: function() {
			this.onRefresh();
			debugger;
			var oTableSearchState = [];
			var idFiltroTipoModelo = this.getView().byId("idFiltroTipoModelo").getSelectedKey();			
			if (idFiltroTipoModelo !== null && idFiltroTipoModelo !== "" && idFiltroTipoModelo !== " ") {
				oTableSearchState.push(new Filter("PREDICTIVE_MODEL_SUBJECT_ID", FilterOperator.EQ, idFiltroTipoModelo));
			} else {
				var idFiltroTipoModelo = this.getView().byId("idFiltroTipoModelo").getValue();
				if (idFiltroTipoModelo !== "") {
					oTableSearchState.push(new Filter("PREDICTIVE_MODEL_SUBJECT_ID", FilterOperator.EQ, "99999"));	
				}				
			}
			
			var idFiltroPeriod = this.getView().byId("idFiltroPeriod").getValue();
			if (idFiltroPeriod !== null && idFiltroPeriod !== "" && idFiltroPeriod !== " ") {
				oTableSearchState.push(new Filter("TRIGGER_NAME", FilterOperator.Contains, idFiltroPeriod));
			}
			this._applySearch(oTableSearchState);
		},

		onClear: function() {
			var oTableSearchState = [];
			this.getView().byId("idFiltroTipoModelo").setSelectedKey();
			this.getView().byId("idFiltroPeriod").setValue(" ");
			//this.onRefresh();
			this._applySearch(oTableSearchState);
		}
	});
});