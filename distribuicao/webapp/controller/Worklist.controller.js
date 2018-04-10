sap.ui.define([
		"com/cpfl/distrib/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"com/cpfl/distrib/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	], function (BaseController, JSONModel, History, formatter, Filter, FilterOperator) {
		"use strict";

		return BaseController.extend("com.cpfl.distrib.controller.Worklist", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				// keeps the search state
				this._oTableSearchState = [];
				this.aItemsCidade = [];
				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
					saveAsTileTitle: this.getResourceBundle().getText("worklistViewTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistViewTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay : 0
				});
				this.setModel(oViewModel, "worklistView");

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
				debugger;
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
			onUpdateFinished : function (oEvent) {
				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total");
				// only update the counter if the length is final and
				// the table is not empty
				debugger;
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
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},


			/**
			 * Event handler for navigating back.
			 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
			 * If not, it will navigate to the shell home
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash(),
					oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

				if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
					history.go(-1);
				} else {
					oCrossAppNavigator.toExternal({
						target: {shellHash: "#Shell-home"}
					});
				}
			},

			/**
			 * Event handler when the share in JAM button has been clicked
			 * @public
			 */
			onShareInJamPress : function () {
				var oViewModel = this.getModel("worklistView"),
					oShareDialog = sap.ui.getCore().createComponent({
						name: "sap.collaboration.components.fiori.sharing.dialog",
						settings: {
							object:{
								id: location.href,
								share: oViewModel.getProperty("/shareOnJamTitle")
							}
						}
					});
				oShareDialog.open();
			},
			onSwitch: function() {
				// This code was generated by the layout editor.
				var status = this.getView().byId("pnlFiltro").getVisible();
				if (status === true) {
					this.getView().byId("pnlFiltro").setVisible(false);
				} else {
					this.getView().byId("pnlFiltro").setVisible(true);
				}
			},			

			onSearch : function (oEvent) {
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
						oTableSearchState = [new Filter("ACTION_NAME", FilterOperator.Contains, sQuery)];
					}
					this._applySearch(oTableSearchState);
				}

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},
			onPressNew : function() {
				// This code was generated by the layout editor.
				this._createObject();
			},	
			onEstadoHelp : function() {
				// This code was generated by the layout editor.
				var that = this;
				var oModel = this.getModel();
				var oInput = this.getView().byId("inEstadoCentro");
				var oViewModel = this.getModel("objectView");
				var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idEstadoHelp", {
					supportMultiselect : false,
					filterMode : true,
					title : "Estado",
					descriptionKey : "REGION_NAME",
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
						label : "Estado",
						template : "REGION_NAME"
					} ]
				});
				var oTable = oValueHelp.getTable();
				oTable.setModel(oColModel, "columns");
				oTable.setModel(this.getModel());

				var estadoList = [];
				var estado;
				// teste
				oModel.read("/distribuicaoOData", {
					// filters : filters,
					success : function(oResponseSucess) {
						// that.aItemsCidade = [];
						debugger;
						var sortedTable = [];
						for (var i = 0; i < oResponseSucess.results.length; i++) {
							sortedTable.push(oResponseSucess.results[i].REGION_NAME);
						}

						debugger;
						sortedTable.sort();
						for (var i = 0; i < sortedTable.length; i++) {
							if (i === 0) {
								estado = sortedTable[i];
								estadoList.push(sortedTable[i]);
							} else {
								if (estado !== sortedTable[i]) {
									estado = sortedTable[i];
									estadoList.push(sortedTable[i]);
								}
							}
						}

						var estadoListSorted = [];
						for (var i = 0; i < estadoList.length; i++) {
							var itemsSorted = [];
							itemsSorted.REGION_NAME = estadoList[i];
							estadoListSorted.push(itemsSorted);
						}

						var oTable = oValueHelp.getTable();
						oTable.setModel(oColModel, "columns");

						var oRowsModel = new sap.ui.model.json.JSONModel();
						oRowsModel.setData(estadoListSorted);
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
			
			onCityHelp : function() {
				// This code was generated by the layout editor.
				var that = this;
				var oModel = this.getModel();
				var oInput = this.getView().byId("inMunicipio");
				var oViewModel = this.getModel("objectView");
				var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idMunicipioHelp", {
					supportMultiselect : false,
					filterMode : true,
					descriptionKey : "CITY_NAME",
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
						label : "Município",
						template : "CITY_NAME"
					} ]
				});
				var oTable = oValueHelp.getTable();
				oTable.setModel(oColModel, "columns");
				oTable.setModel(this.getModel());

				var MunicipioList = [];
				var Municipio;
				// teste
				oModel.read("/distribuicaoOData", {
					// filters : filters,
					success : function(oResponseSucess) {
						// that.aItemsCidade = [];
						debugger;
						var sortedTable = [];
						for (var i = 0; i < oResponseSucess.results.length; i++) {
							sortedTable.push(oResponseSucess.results[i].CITY_NAME);
						}
						
						sortedTable.sort();
						for (var i = 0; i < sortedTable.length; i++) {
							if (i === 0) {
								Municipio = sortedTable[i];
								MunicipioList.push(sortedTable[i]);
							} else {
								if (Municipio !== sortedTable[i]) {
									Municipio = sortedTable[i];
									MunicipioList.push(sortedTable[i]);
								}
							}
						}

						var MunicipioListSorted = [];
						for (var i = 0; i < MunicipioList.length; i++) {
							var itemsSorted = [];
							itemsSorted.CITY_NAME = MunicipioList[i];
							MunicipioListSorted.push(itemsSorted);
						}

						var oTable = oValueHelp.getTable();
						oTable.setModel(oColModel, "columns");

						var oRowsModel = new sap.ui.model.json.JSONModel();
						oRowsModel.setData(MunicipioListSorted);
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
			onCanalHelp : function() {
				// This code was generated by the layout editor.
				var that = this;
				var oModel = this.getModel();
				var oInput = this.getView().byId("inCanalNot");
				var oViewModel = this.getModel("objectView");
				var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idCanalHelp", {
					supportMultiselect : false,
					filterMode : true,
					title : "Canal de Notificação",
					descriptionKey : "CHANNEL_NAME",
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
						label : "Canal",
						template : "CHANNEL_NAME"
					} ]
				});
				var oTable = oValueHelp.getTable();
				oTable.setModel(oColModel, "columns");
				oTable.setModel(this.getModel());

				var canalList = [];
				var canal;
				// teste
				oModel.read("/distribuicaoOData", {
					// filters : filters,
					success : function(oResponseSucess) {
						// that.aItemsCidade = [];				
						debugger;
						var sortedTable = [];
						for (var i = 0; i < oResponseSucess.results.length; i++) {
							sortedTable.push(oResponseSucess.results[i].CHANNEL_NAME);
						}

						debugger;
						sortedTable.sort();
						for (var i = 0; i < sortedTable.length; i++) {
							if (i === 0) {
								canal = sortedTable[i];
								canalList.push(sortedTable[i]);
							} else {
								if (canal !== sortedTable[i]) {
									canal = sortedTable[i];
									canalList.push(sortedTable[i]);
								}
							}
						}

						var canalListSorted = [];
						for (var i = 0; i < canalList.length; i++) {
							var itemsSorted = [];
							itemsSorted.CHANNEL_NAME = canalList[i];
							canalListSorted.push(itemsSorted);
						}						
						
						var oTable = oValueHelp.getTable();
						oTable.setModel(oColModel, "columns");

						var oRowsModel = new sap.ui.model.json.JSONModel();
						oRowsModel.setData(canalListSorted);
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
			onEmpresaHelp : function() {
				// This code was generated by the layout editor.
				var that = this;
				var oModel = this.getModel();
				var oInput = this.getView().byId("inEmpresa");
				var oViewModel = this.getModel("objectView");
				var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idEmpresaHelp", {
					supportMultiselect : false,
					filterMode : true,
					title : "Empresa",
					descriptionKey : "BUTXT",
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
						label : "Empresa",
						template : "BUTXT"
					} ]
				});
				var oTable = oValueHelp.getTable();
				oTable.setModel(oColModel, "columns");
				oTable.setModel(this.getModel());

				var empresaList = [];
				var empresa;
				// teste
				oModel.read("/distribuicaoOData", {
					// filters : filters,
					success : function(oResponseSucess) {
						// that.aItemsCidade = [];				
						debugger;
						var sortedTable = [];
						for (var i = 0; i < oResponseSucess.results.length; i++) {
							sortedTable.push(oResponseSucess.results[i].BUTXT);
						}

						debugger;
						sortedTable.sort();
						for (var i = 0; i < sortedTable.length; i++) {
							if (i === 0) {
								empresa = sortedTable[i];
								empresaList.push(sortedTable[i]);
							} else {
								if (empresa !== sortedTable[i]) {
									empresa = sortedTable[i];
									empresaList.push(sortedTable[i]);
								}
							}
						}

						var empresaListSorted = [];
						for (var i = 0; i < empresaList.length; i++) {
							var itemsSorted = [];
							itemsSorted.BUTXT = empresaList[i];
							empresaListSorted.push(itemsSorted);
						}						
						
						var oTable = oValueHelp.getTable();
						oTable.setModel(oColModel, "columns");

						var oRowsModel = new sap.ui.model.json.JSONModel();
						oRowsModel.setData(empresaListSorted);
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
				oModel.read("/distribuicaoOData", {
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
				this.getView().byId("inEstadoCentro").setValue("");
				this.getView().byId("inMunicipio").setValue("");
				this.getView().byId("inCanalNot").setValue("");
				this.getView().byId("inEmpresa").setValue("");
				this.getView().byId("inAcao").setValue("");
				this.aItemsCidade = [];
				//this.onRefresh();
				this._applySearch(oTableSearchState);
			},
						
			onFilter : function() {
				debugger;
				// This code was generated by the layout editor.
				this.onRefresh();
				var oTableSearchState = [];
				//Filtro Canal
				var idFiltroCanal = $.trim(this.byId("inCanalNot").getValue());
				if (idFiltroCanal) {
					oTableSearchState.push(new Filter("CHANNEL_NAME", FilterOperator.Contains, idFiltroCanal));
				}	
				//Filtro Empresa
				var idFiltroEmpresa = $.trim(this.byId("inEmpresa").getValue());
				if (idFiltroEmpresa) {
					oTableSearchState.push(new Filter("BUTXT", FilterOperator.Contains, idFiltroEmpresa));
				}					
				//Filtro Ação
				var idFiltroAcaoCobranca = $.trim(this.byId("inAcao").getValue());
				if (idFiltroAcaoCobranca) {
					oTableSearchState.push(new Filter("ACTION_NAME", FilterOperator.Contains, idFiltroAcaoCobranca));
				}	
				
				//Filtro Estado
				var idFiltroEstado = $.trim(this.byId("inEstadoCentro").getValue());
				if (idFiltroEstado) {
					oTableSearchState.push(new Filter("REGION_NAME", FilterOperator.Contains, idFiltroEstado));
				}		
				
				//Filtro Municipio
				var idFiltroMunicipio = $.trim(this.byId("inMunicipio").getValue());
				if (idFiltroMunicipio) {
					oTableSearchState.push(new Filter("CITY_NAME", FilterOperator.Contains, idFiltroMunicipio));
				}				
			

				this._applySearch(oTableSearchState);
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
			_createObject : function() {
				debugger;
				this.getRouter().navTo("object", {
					objectId : "Novo"
				});
			},			
			_showObject : function (oItem) {
				debugger;
				var distID = oItem.getBindingContext().getProperty("DISTRIBUTION_ID");
//				var validFrom = oItem.getBindingContext().getProperty("VALID_FROM");
				var separador = "#";

//				var chave = distID + separador + validFrom;
				var chave = distID;
				this.getRouter().navTo("object", {
					objectId : chave
				// oItem.getBindingContext().getProperty("ACTION_ID")

				});				
//				this.getRouter().navTo("object", {
//					objectId: oItem.getBindingContext().getProperty("DISTRIBUTION_ID")
//				});
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
					oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
				}
			}

		});
	}
);