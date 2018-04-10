sap.ui.define([ "com/cpfl/filtrospoliticos/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/filtrospoliticos/model/formatter", "sap/ui/model/Filter", "sap/ui/model/FilterOperator" ], function(BaseController, JSONModel, History, formatter, Filter,
		FilterOperator) {
	"use strict";

	return BaseController.extend("com.cpfl.filtrospoliticos.controller.Worklist", {

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

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
				tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay : 0
			});
			this.setModel(oViewModel, "worklistView");

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
					oTableSearchState = [ new Filter("ACTION_ID", FilterOperator.Contains, sQuery) ];
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
			var ACTION_ID = oItem.getBindingContext().getProperty("ACTION_ID");
			var VALID_FROM = oItem.getBindingContext().getProperty("VALID_FROM");
			var key = ACTION_ID + "#" + VALID_FROM;

			this.getRouter().navTo("object", {
				objectId : key
			});
		},
		/**
		 */
		_createObject : function() {
			this.getRouter().navTo("object", {
				objectId : "Create"
			});
		},
		/**
		 */
		_previewObject : function(oItem) {
			var ACTION_ID = oItem.getBindingContext().getProperty("ACTION_ID");
			var VALID_FROM = oItem.getBindingContext().getProperty("VALID_FROM");
			var key = ACTION_ID + "#" + VALID_FROM;
			
			this.getRouter().navTo("preview", { 
				objectId : key
			});
		},
		/**
		 * @memberOf com.cpfl.filtrosPoliticos.controller.Worklist
		 */
		onCreate : function(oEvent) {
			// This code was generated by the layout editor.
			this._createObject();
		},
		/**
		 * @memberOf com.cpfl.filtrosPoliticos.controller.Worklist
		 */
		onPreview : function(oEvent) {
			// This code was generated by the layout editor.
			this._previewObject(oEvent.getSource());
		},
		/**
		 * @memberOf com.cpfl.filtrosPoliticos.controller.Worklist Hide options
		 *           of filters
		 */
		onSwitch : function() {
			// This code was generated by the layout editor.
			var status = this.getView().byId("pnlFiltro").getVisible();
			if (status === true) {
				this.getView().byId("pnlFiltro").setVisible(false);
			} else {
				this.getView().byId("pnlFiltro").setVisible(true);
			}
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
				oTableSearchState = [];
			} else {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},
		onFilter: function() {
			this.onRefresh();
			debugger;
			var oTableSearchState = [];
			var idEmpresa = this.getView().byId("comboEmpresa").getSelectedKey();			
			if (idEmpresa !== null && idEmpresa !== "" && idEmpresa !== " ") {
				oTableSearchState.push(new Filter("BUKRS", FilterOperator.EQ, idEmpresa));				
			}
			
//			var idActionId = this.getView().byId("comboAcao").getSelectedKey();
//			if (idActionId !== null && idActionId !== "" && idActionId !== " ") {
//				oTableSearchState.push(new Filter("ACTION_ID", FilterOperator.EQ, idActionId));
//			}
			//Filtro Ação
			var idFiltroAcaoCobranca = $.trim(this.byId("inAcao").getValue());
			if (idFiltroAcaoCobranca) {
				oTableSearchState.push(new Filter("ACTION_NAME", FilterOperator.Contains, idFiltroAcaoCobranca));
			}			
			this._applySearch(oTableSearchState);
		},
		onAcaoHelp : function() {
			// This code was generated by the layout editor.
			var that = this;
			var oModel = this.getModel();
			var oInput = this.getView().byId("inAcao");
			var oViewModel = this.getModel("objectView");
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAcaoHelp", {
				supportMultiselect : false,
				filterMode : true,
				title : "Ação",
				descriptionKey : "ACTION_NAME",
				ok : function(oEventCanal) {
					var aTokens = oEventCanal.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setValue(token.getText());
						var key = token.getKey();
					}
					oValueHelp.close();
				},
				cancel : function() {
					oValueHelp.close();
				},
				afterClose : function() {
					oValueHelp.destroy();
				}
			});
			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols : [ {
					label : "Ação",
					template : "ACTION_NAME"
				} ]
			});
			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");
			oTable.setModel(this.getModel());

			var acaoList = [];
			var acao;
			// teste
			oModel.read("/filtroPoliticoOData", {
				// filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];				
					debugger;
					var sortedTable = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						sortedTable.push(oResponseSucess.results[i].ACTION_NAME);
					}

					debugger;
					sortedTable.sort();
					for (var i = 0; i < sortedTable.length; i++) {
						if (i === 0) {
							acao = sortedTable[i];
							acaoList.push(sortedTable[i]);
						} else {
							if (acao !== sortedTable[i]) {
								acao = sortedTable[i];
								acaoList.push(sortedTable[i]);
							}
						}
					}

					var acaoListSorted = [];
					for (var i = 0; i < acaoList.length; i++) {
						var itemsSorted = [];
						itemsSorted.ACTION_NAME = acaoList[i];
						acaoListSorted.push(itemsSorted);
					}						
					
					var oTable = oValueHelp.getTable();
					oTable.setModel(oColModel, "columns");

					var oRowsModel = new sap.ui.model.json.JSONModel();
					oRowsModel.setData(acaoListSorted);
					oTable.setModel(oRowsModel);
					if (oTable.bindRows) {
						oTable.bindRows("/");
					}

					oValueHelp.addStyleClass("sapUiSizeCozy");
					oValueHelp.open();
					oValueHelp.update();

				},
				error : function(oResponseSucess) {

				}

			});
			// oTable.setModel(oColModel, "columns");
			// oTable.setModel(this.getModel());
			// oTable.bindRows("/servicoCampoOData");
			// oValueHelp.open();
			// oValueHelp.update();
		},			

		onClear: function() {
			var oTableSearchState = [];
			this.getView().byId("comboEmpresa").setSelectedKey();
//			this.getView().byId("comboAcao").setSelectedKey();
			this.getView().byId("inAcao").setValue("");
			//this.onRefresh();
			this._applySearch(oTableSearchState);
		}
	});
});