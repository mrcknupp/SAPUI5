sap.ui.define([ "acao/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "acao/model/formatter", "sap/ui/model/Filter", "sap/ui/model/FilterOperator" ], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator) {
	"use strict";
	return BaseController.extend("acao.controller.Worklist", {
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
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._oTableSearchState = [];
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
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
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
		 * Triggered by the table's 'updateFinished' event: after new table data is
		 * available, this handler method updates the table counter. This should
		 * only happen if the update was successful, which is why this handler is
		 * attached to 'updateFinished' and not to the table's list binding's
		 * 'dataReceived' method.
		 * 
		 * @param {sap.ui.base.Event}
		 *          oEvent the update finished event
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
		 *          oEvent the table selectionChange event
		 * @public
		 */
		onPress : function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},
		/**
		 * Event handler for navigating back. It there is a history entry or an
		 * previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * 
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash(), oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			// if (sPreviousHash !== undefined ||
			// !oCrossAppNavigator.isInitialNavigation()) {
			// history.go(-1);
			// } else {
			oCrossAppNavigator.toExternal({
				target : {
					shellHash : "#Shell-home"
				}
			});
			// }
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
		 * Event handler for refresh event. Keeps filter, sort and group settings
		 * and refreshes the list binding.
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
		 * Shows the selected item on the object page On phones a additional history
		 * entry is created
		 * 
		 * @param {sap.m.ObjectListItem}
		 *          oItem selected Item
		 * @private
		 */
		_showObject : function(oItem) {
			var actionID = oItem.getBindingContext().getProperty("ACTION_ID");
			var validFrom = oItem.getBindingContext().getProperty("VALID_FROM");
			var separador = "#";

			var chave = actionID + separador + validFrom;
			this.getRouter().navTo("object", {
				objectId : chave
			// oItem.getBindingContext().getProperty("ACTION_ID")

			});
		},
		/**
		 * Internal helper method to apply both filter and search state together on
		 * the list binding
		 * 
		 * @param {object}
		 *          oTableSearchState an array of filters for the search
		 * @private
		 */
		_applySearch : function(oTableSearchState) {
			var oTable = this.byId("table"), oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(oTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (oTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},
		/**
		 * @memberOf acao.controller.Worklist
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
		 * @memberOf acao.controller.Worklist
		 */
		onClick : function() {
			// This code was generated by the layout editor.
			this.getRouter().getTargets().display("change");
		},
		/**
		 * @memberOf acao.controller.Worklist
		 */
		onAdd : function() {
			// This code was generated by the layout editor.
			this.getModel("criarView").setProperty("/addEnabled", false);
			this.getRouter().getTargets().display("create");
		},
		/**
		 * @memberOf acao.controller.Worklist
		 */
		_createObject : function() {
			this.getRouter().navTo("object", {
				objectId : "Novo"
			});
		},
		onPressNew : function() {
			// This code was generated by the layout editor.
			this._createObject();
		},
		/**
		 * @memberOf acao.controller.Worklist
		 */
		handleUploadPress : function() {
			// This code was generated by the layout editor.
			var oFileUploader = this.getView().byId("fileUploader");
			oFileUploader.upload();
		},
		/**
		 * @memberOf acao.controller.Worklist
		 */
		onClear: function() {
			var oTableSearchState = [];
			this.getView().byId("comboEmpresa").setValue("");
			this.getView().byId("inFilterAcao").setValue("");
			//this.onRefresh();
			this._applySearch(oTableSearchState);
		},
		
		onFilter : function() {
			// This code was generated by the layout editor.
			this.onRefresh();
			var oTableSearchState = [];
			var clearEmpresa = this.byId("comboEmpresa").getValue();
			if (clearEmpresa === "")
			{
				this.byId("comboEmpresa").setSelectedKey("");
			}
			var idFiltroEmpresa = $.trim(this.byId("comboEmpresa").getSelectedKey());
			var idFiltroAcaoCobranca = $.trim(this.byId("inFilterAcao").getValue());
			if (idFiltroEmpresa) {
				oTableSearchState.push(new Filter("BUKRS", FilterOperator.Contains, idFiltroEmpresa));
			}
			if (idFiltroAcaoCobranca) {
				oTableSearchState.push(new Filter("NAME", FilterOperator.Contains, idFiltroAcaoCobranca));
			}
			debugger;
			var idFiltroCanal = $.trim(this.byId("inFilterCanal").getValue());
			if (idFiltroCanal) {
				oTableSearchState.push(new Filter("CHANNEL_NAME", FilterOperator.Contains, idFiltroCanal));
			}			
			this._applySearch(oTableSearchState);
		},
		/**
		 * @memberOf acao.controller.Worklist
		 */
		onHelpEmpresa : function() {
			// This code was generated by the layout editor.
			var oInput = this.getView().byId("inFilterEmpresa");
			// This code was generated by the layout editor.
			// if (!oValueEmpresa) {
			var oValueEmpresa = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idEmpreFilterHelp", {
				supportMultiselect : false,
				key : "BUKRS",
				ok : function(oEventEmpresa) {
					var aTokens = oEventEmpresa.getParameter("tokens");

					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setValue(token.getKey());
					}

					oValueEmpresa.close();
				},
				cancel : function() {
					oValueEmpresa.close();
				},

				afterClose : function() {
					oValueEmpresa.destroy();

				}
			});
			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols : [ {
					label : "ID da Empresa",
					template : "BUKRS"
				},

				{
					label : "Nome da Empresa",
					template : "BUTXT"
				}, {
					label : "Cidade",
					template : "LAND1"
				} ]
			});
			var oTable = oValueEmpresa.getTable();
			oTable.setModel(oColModel, "columns");
			oTable.setModel(this.getModel());
			oTable.bindRows("/empresaOData");
			oValueEmpresa.open();
			oValueEmpresa.update();
		}
	});
});