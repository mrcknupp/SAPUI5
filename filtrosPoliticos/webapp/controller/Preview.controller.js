	sap.ui.define([ "com/cpfl/filtrospoliticos/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/filtrospoliticos/model/formatter", "sap/ui/model/Filter", "sap/ui/model/FilterOperator" ], function(BaseController, JSONModel, History, formatter, Filter,
		FilterOperator) {
	"use strict";

	return BaseController.extend("com.cpfl.filtrospoliticos.controller.Preview", {

		/* =========================================================== */
		/* lifecycle methods */
		/* =========================================================== */

		onInit : function() {

			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				tableBusyDelay : 0
			});

			this.aConsolidado = [];
			this.aDetalhado = [];

			this.getRouter().getRoute("preview").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator delay, so it can be restored later
			// on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "previewView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers */
		/* =========================================================== */
		/**
		 * Event handler for navigating back. It there is a history entry or an
		 * previous app-to-app navigation we go one step back in the browser
		 * history If not, it will replace the current entry of the browser
		 * history with the worklist route.
		 * 
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();
			// var oCrossAppNavigator =
			// Container.getService("CrossApplicationNavigation");

			// if (sPreviousHash !== undefined ||
			// !oCrossAppNavigator.isInitialNavigation()) {
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		/* =========================================================== */
		/* internal methods */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * 
		 * @function
		 * @param {sap.ui.base.Event}
		 *            oEvent pattern match event in route 'object'
		 * @private
		 */

		_onObjectMatched : function(oEvent) {

			var oViewModel = this.getModel("previewView");
			var oView = this.getView();
			var sObjectId = oEvent.getParameter("arguments").objectId;

			oViewModel.setProperty("/title", this.getView().getModel("i18n").getResourceBundle().getText("displayPreview"));
			var array = sObjectId.split("#");
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("filtroPoliticoOData", {
					ACTION_ID : array[0],
					VALID_FROM : array[1]
				});
				oViewModel.setProperty("/actionId", array[0]);
				this._bindView("/" + sObjectPath);

			}.bind(this));

		},

		/**
		 * Binds the view to the object path.
		 * 
		 * @function
		 * @param {string}
		 *            sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView : function(sObjectPath) {
			var oViewModel = this.getModel("previewView"), oDataModel = this.getModel();

			this.getView().bindElement({
				path : sObjectPath,
				events : {
					change : this._onBindingChange.bind(this),
					dataRequested : function() {
						oDataModel.metadataLoaded().then(function() {
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived : function() {

						// that.onDisplayLayout();
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange : function() {
			var oView = this.getView(), oViewModel = this.getModel("previewView"), oElementBinding = oView.getElementBinding();
			var oObject = oView.getBindingContext().getObject();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			// this.onDisplayLayout();
			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.ACTION_ID;

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
		},		
		
		onCancelar : function() {
			var cTable = this.getView().byId("table1");
			var dTable = this.getView().byId("table2");
			
			var oNullCon = new sap.ui.model.json.JSONModel({cData: null});							
			cTable.setModel(oNullCon);	
			
			var oNullDet = new sap.ui.model.json.JSONModel({dData: null});							
			dTable.setModel(oNullDet);
			
			this.onNavBack();
		},
		
		onExecutar : function() {
			var oViewModel = this.getModel("previewView");
			var model = {};
			model.ACTION_ID = oViewModel.getProperty("/actionId")
			model.WHERE = this.getView().byId("inAFiltro").getValue();

			if (this.getView().byId("rbUf").getSelected() === true) {
				model.AGGREGATION = 1;
			}
			if (this.getView().byId("rbMunicipio").getSelected() === true) {
				model.AGGREGATION = 2;
			}
			if (this.getView().byId("rbBairro").getSelected() === true) {
				model.AGGREGATION = 3;
			}

			model.ROWS = this.getView().byId("inQtdreg").getValue();
			console.log("Preview::::\n" + JSON.stringify(model));

			this.onPost(model);
		},
		onPost : function(oModel) {
			var that = this;
			var oViewModel = this.getModel("previewView");
			var cTable = that.getView().byId("table1");
			var dTable = that.getView().byId("table2");
			that.aConsolidado = [];
			that.aDetalhado = [];
			sap.ui.core.BusyIndicator.show();
			
			debugger;
			jQuery.ajax({
				url : "/accs/services/previewPoliticalFilter.xsjs",
				method : 'POST',
				data : JSON.stringify(oModel),
				contentType : 'application/json; charset=utf-8',

				success : function(oData, response) {
					
					if (oData.ERROR) {
						sap.m.MessageBox.error(oData.ERROR.message, {
							id : "serviceErrorBox",
							details : oData.ERROR.code + oData.ERROR.log,
							actions : [ sap.m.MessageBox.Action.CLOSE ],
							onClose : function() {
								oViewModel.setProperty("/busy", false);
								sap.ui.core.BusyIndicator.hide();
								oViewModel.refresh();
								that.onNavBack();
							}.bind(this)
						});
					} else {
						if(oData){
							var str = oData;
							if(str.includes("Failed")){
								sap.m.MessageBox.error(str, {
									id : "serviceErrorBox",
									actions : [ sap.m.MessageBox.Action.CLOSE ],
									onClose : function() {
										debugger;
										oViewModel.setProperty("/busy", false);
										sap.ui.core.BusyIndicator.hide();
										oViewModel.refresh();
										that.onNavBack();	
										
//										return;
									}.bind(this)
								});								
							}
						}
											
						if (oData.responseBody.CONSOLIDADO.length > 0) {
							for (var i = 0; i < oData.responseBody.CONSOLIDADO.length; i++) {
								var item = oData.responseBody.CONSOLIDADO[i];
								that.aConsolidado.push(item);
							}
							sap.ui.core.BusyIndicator.hide();
							var oRowsModelCon = new sap.ui.model.json.JSONModel({cData: that.aConsolidado});							
							cTable.setModel(oRowsModelCon);							
						}

						if (oData.responseBody.DETALHADO.length > 0) {
							for (var i = 0; i < oData.responseBody.DETALHADO.length; i++) {
								var item = oData.responseBody.DETALHADO[i];
								that.aDetalhado.push(item);
							}
							var oRowsModelDet = new sap.ui.model.json.JSONModel({dData: that.aDetalhado});							
							dTable.setModel(oRowsModelDet);
						}
						
						// MessageToast.show(that.getResourceBundle().getText("msgSucessoOperacao"));						
						oViewModel.refresh();
					}
				},
				error : function(oResponseError) {
					
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.error(oResponseError.responseJSON.myResult, {
						id : "serviceErrorMessageBox",
						details : "",
						actions : [ sap.m.MessageBox.Action.CLOSE ],
						onClose : function() {
							oViewModel.setProperty("/busy", false);
							sap.ui.core.BusyIndicator.hide();
							that.onNavBack();
						}.bind(this)
					});
				}
			});
		}
	});

});