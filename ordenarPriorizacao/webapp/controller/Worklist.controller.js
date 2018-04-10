sap.ui.define([ "com/cpfl/ordenarpriorizacao/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/ordenarpriorizacao/model/formatter", "sap/ui/model/Filter", "sap/ui/model/FilterOperator" ], function(BaseController, JSONModel, History, formatter,
		Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.cpfl.ordenarpriorizacao.controller.Worklist", {

		formatter : formatter,

		/* =========================================================== */
		/* lifecycle methods */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * 
		 * @public
		 */
		onInit : function() {
			var oViewModel, iOriginalBusyDelay, oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator
			// delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._oTableSearchState = [];
			this.aItemsRefresh = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle : this.getResourceBundle().getText("worklistViewTitle"),
				shareOnJamTitle : this.getResourceBundle().getText("worklistViewTitle"),
				shareSendEmailSubject : this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage : this.getResourceBundle().getText("shareSendEmailWorklistMessage", [ location.href ]),
				tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay : 0
			});
			this.setModel(oViewModel, "worklistView");

			var canalModel = {};
			canalModel.tableItems = [];
			this.setModel(new JSONModel(canalModel), "worklistView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data
			// is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table data
		 * is available, this handler method updates the table counter. This
		 * should only happen if the update was successful, which is why this
		 * handler is attached to 'updateFinished' and not to the table's list
		 * binding's 'dataReceived' method.
		 * 
		 * @param {sap.ui.base.Event}
		 *            oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function(oEvent) {
			debugger;
			// update the worklist's object counter after the table update
			var sTitle, oTable = oEvent.getSource(), iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [ iTotalItems ]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * 
		 * @param {sap.ui.base.Event}
		 *            oEvent the table selectionChange event
		 * @public
		 */
		onPress : function(oEvent) {
			debugger;
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler for navigating back. It there is a history entry or an
		 * previous app-to-app navigation we go one step back in the browser
		 * history If not, it will navigate to the shell home
		 * 
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash(), oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target : {
						shellHash : "#Shell-home"
					}
				});
			}
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * 
		 * @public
		 */
		onShareInJamPress : function() {
			var oViewModel = this.getModel("worklistView"), oShareDialog = sap.ui.getCore().createComponent({
				name : "sap.collaboration.components.fiori.sharing.dialog",
				settings : {
					object : {
						id : location.href,
						share : oViewModel.getProperty("/shareOnJamTitle")
					}
				}
			});
			oShareDialog.open();
		},

		onSearch : function(oEvent) {
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
					oTableSearchState = [ new Filter("NAME", FilterOperator.Contains, sQuery) ];
				}
				this._applySearch(oTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort and group
		 * settings and refreshes the list binding.
		 * 
		 * @public
		 */
		onRefresh : function() {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page On phones a additional
		 * history entry is created
		 * 
		 * @param {sap.m.ObjectListItem}
		 *            oItem selected Item
		 * @private
		 */
		_showObject : function(oItem) {
			// this.getView().byId("table").getSelectedItems();

			this.getRouter().navTo("object", {
				objectId : oItem.getBindingContext().getProperty("CHANNEL_ID")
			});
		},

		onUp : function() {
			debugger;
			var that = this;
			var oModel = this.getModel();
			var oTable = this.getView().byId("table");
			var oItems = oTable.getItems();
			var oTable2 = this.getView().byId("table");
			var oItems2 = oTable2.getSelectedItem();
			
			var i = parseInt(oItems2.getBindingContext().getProperty("EXECUTION_ORDER")) - 1;


			if (i === 0) {
				sap.m.MessageBox.information("Item já é o primeiro da lista!");
				return;
			}

			var atual = {}, anterior = {}, aux = {};
			var indexAnterior = i - 1;
			aux = oItems[i];
			oItems[i] = oItems[indexAnterior];
			oItems[indexAnterior] = aux;
			debugger;
			for (var j = 0; j <= oItems.length; j++) {
//				if (j === i || j === indexAnterior) { 
					var key = oItems[j].getBindingContext().getProperty("CHANNEL_ID");
					var list = {};
					list.CHANNEL_ID = oItems[j].getBindingContext().getProperty("CHANNEL_ID");
					list.NAME = oItems[j].getBindingContext().getProperty("NAME");
					var execOrder = j + 1;
					list.EXECUTION_ORDER = execOrder.toString();
					debugger;
					oModel.update("/channelExecOrderOData(" + key + ")", list, {
						merge : false,
						success : function(oData, response) {
							debugger;
							oModel.refresh();
						},
						error : function(oResponseError) {
							sap.ui.commons.MessageBox.alert("Erro ao atualizar");
						}
					});
//				}

			}
			
			
			
			// for (var j = 0; j < oItems.length; j++) {
			// if (j === i || j === indexAnterior) {
			// var key =
			// oItems[j].getBindingContext().getProperty("CHANNEL_ID");
			// var list = {};
			// list.CHANNEL_ID =
			// oItems[j].getBindingContext().getProperty("CHANNEL_ID");
			// list.NAME = oItems[j].getBindingContext().getProperty("NAME");
			//
			// if (j === i) {
			// var indexMa = j - 1;
			// list.EXECUTION_ORDER =
			// oItems[indexMa].getBindingContext().getProperty("EXECUTION_ORDER");
			// }
			//
			// if (j === indexAnterior) {
			// var indexMe = j + 1;
			// list.EXECUTION_ORDER =
			// oItems[indexMe].getBindingContext().getProperty("EXECUTION_ORDER");
			// }

			// oModel.update("/channelExecOrderOData(" + key + ")", list, {
			// merge : false,
			// success : function(oData, response) {
			// oModel.refresh();
			// },
			// error : function(oResponseError) {
			// sap.ui.commons.MessageBox.alert("Erro ao atualizar");
			// }
			// });
			// }

			// }

			that.onRefresh();

		},

		onDown : function() {
			var that = this;
			var oModel = this.getModel();
			var oTable = this.getView().byId("table");
			var oItems = oTable.getItems();
			var oTable2 = this.getView().byId("table");
			var oItems2 = oTable2.getSelectedItem();
			
			var i = parseInt(oItems2.getBindingContext().getProperty("EXECUTION_ORDER")) - 1;


			if (i === oItems.length) {
			sap.m.MessageBox.information("Item já é o último da lista!");
			return;
		}

			var atual = {}, anterior = {}, aux = {};
			var indexAnterior = i + 1;
			aux = oItems[i];
			oItems[i] = oItems[indexAnterior];
			oItems[indexAnterior] = aux;
			debugger;
			for (var j = 0; j <= oItems.length; j++) {
//				if (j === i || j === indexAnterior) { 
					var key = oItems[j].getBindingContext().getProperty("CHANNEL_ID");
					var list = {};
					list.CHANNEL_ID = oItems[j].getBindingContext().getProperty("CHANNEL_ID");
					list.NAME = oItems[j].getBindingContext().getProperty("NAME");
					var execOrder = j + 1;
					list.EXECUTION_ORDER = execOrder.toString();
					debugger;
					oModel.update("/channelExecOrderOData(" + key + ")", list, {
						merge : false,
						success : function(oData, response) {
							debugger;
							oModel.refresh();
						},
						error : function(oResponseError) {
							sap.ui.commons.MessageBox.alert("Erro ao atualizar");
						}
					});
//				}
 
			}
			
			
//			var that = this;
//			var oModel = this.getModel();
//			var oTable = this.getView().byId("table");
//			var oItems = oTable.getItems();
//			var oTable2 = this.getView().byId("table");
//			var oItems2 = oTable2.getSelectedItem();
//
//			var channelID = oItems2.getBindingContext().getProperty("CHANNEL_ID");
//
//			for (var l = 0; l < oItems.length; l++) {
//				if (oItems[l].getBindingContext().getProperty("CHANNEL_ID") === channelID) {
//					var i = l;
//				}
//			}
//			var ultimo = i + 1;
//			if (ultimo === oItems.length) {
//				sap.m.MessageBox.information("Item já é o último da lista!");
//				return;
//			}
//
//			var atual = {}, anterior = {}, aux = {};
//			var indexProximo = i + 1;
//			aux = oItems[i];
//			oItems[i] = oItems[indexProximo];
//			oItems[indexProximo] = aux;
//
//			for (var j = 0; j < oItems.length; j++) {
//				if (j === i || j === indexProximo) {
//					var key = oItems[j].getBindingContext().getProperty("CHANNEL_ID");
//					var list = {};
//					list.CHANNEL_ID = oItems[j].getBindingContext().getProperty("CHANNEL_ID");
//					list.NAME = oItems[j].getBindingContext().getProperty("NAME");
//
//					if (j === i) {
//						var indexMa = j + 1;
//						list.EXECUTION_ORDER = oItems[indexMa].getBindingContext().getProperty("EXECUTION_ORDER");
//					}
//
//					if (j === indexProximo) {
//						var indexMe = j - 1;
//						list.EXECUTION_ORDER = oItems[indexMe].getBindingContext().getProperty("EXECUTION_ORDER");
//					}
//
//					oModel.update("/channelExecOrderOData(" + key + ")", list, {
//						merge : false,
//						success : function(oData, response) {
//							oModel.refresh();
//						},
//						error : function(oResponseError) {
//							sap.ui.commons.MessageBox.alert("Erro ao atualizar");
//						}
//					});
//				}
//
//			}

			that.onRefresh();

		},

		/**
		 * Internal helper method to apply both filter and search state together
		 * on the list binding
		 * 
		 * @param {object}
		 *            oTableSearchState an array of filters for the search
		 * @private
		 */
		_applySearch : function(oTableSearchState) {
			var oTable = this.byId("table"), oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(oTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter
			// results
			if (oTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});