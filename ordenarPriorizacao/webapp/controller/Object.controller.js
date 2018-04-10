/*global location*/
sap.ui.define([ "com/cpfl/ordenarpriorizacao/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/ordenarpriorizacao/model/formatter" ], function(BaseController, JSONModel, History, formatter) {
	"use strict";

	return BaseController.extend("com.cpfl.ordenarpriorizacao.controller.Object", {

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
			// Model used to manipulate control states. The chosen values make
			// sure,
			// detail page is busy indication immediately so there is no break
			// in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				key : ""
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later
			// on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");

			var acoesModel = {};
			acoesModel.tableItems = [];
			this.setModel(new JSONModel(acoesModel), "objectView");

			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers */
		/* =========================================================== */

		/**
		 * Event handler when the share in JAM button has been clicked
		 * 
		 * @public
		 */
		onShareInJamPress : function() {
			var oViewModel = this.getModel("objectView"), oShareDialog = sap.ui.getCore().createComponent({
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

			this.getRouter().navTo("worklist", {}, true);
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
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("canalNotificacaoOData", {
					CHANNEL_ID : sObjectId
				});

				var oViewModel = this.getModel("objectView");
				oViewModel.setProperty("/key", sObjectId);
				this.setModel(new JSONModel({
					tableItems : []
				}), "acoesModel");

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
			var oViewModel = this.getModel("objectView"), oDataModel = this.getModel();

			this.getView().bindElement({
				path : sObjectPath,
				events : {
					change : this._onBindingChange.bind(this),
					dataRequested : function() {
						oDataModel.metadataLoaded().then(function() {
							// Busy indicator on view should only be set if
							// metadata is
							// loaded,
							// otherwise there may be two busy indications next
							// to each other
							// on the
							// screen. This happens because route matched
							// handler already
							// calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived : function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange : function() {
			var oView = this.getView(), oViewModel = this.getModel("objectView"), oElementBinding = oView.getElementBinding();

			var oModel = this.getModel();
			// var sPath = oElementBinding.getBoundContext().getPath(),
			// oResourceBundle = this.getResourceBundle();

			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData;
			if (!acoesModel) {
				oCoesModelData = {};
				oCoesModelData.tableItems = [];
				acoesModel = new JSONModel(oCoesModelData);
				this.setModel(acoesModel, "acoesModel");
			}
			debugger;
			oCoesModelData = acoesModel.getData();

			var where = parseInt(oViewModel.getProperty("/key"));
			var filters = new Array();
			var filterByID = new sap.ui.model.Filter("CHANNEL_ID", sap.ui.model.FilterOperator.EQ, where);
			filters.push(filterByID);
			oModel.read("/actionExecOrderOData?$orderby=EXECUTION_ORDER asc", {
				filters : filters,
				success : function(oResponseSucess) {
					var itemsSorted = [];
					var sort_by = function(field, reverse, primer) {
						debugger;
						var key = primer ? function(x) {
							return primer(x[field])
						} : function(x) {
							return x[field]
						};

						reverse = !reverse ? 1 : -1;

						return function(a, b) {
							return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
						}
					}
					debugger;
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var item = oResponseSucess.results[i];
						itemsSorted.push(item);
					}
					itemsSorted.sort(sort_by('EXECUTION_ORDER', false, parseInt));
					// // Sort case-insensitive, Z-A
					// itemsSorted.sort(sort_by('NAME', true, function(a){return
					// a.toUpperCase()}));
					debugger;
					for (var i = 0; i < itemsSorted.length; i++) {
						var item = itemsSorted[i];
						debugger;
						oCoesModelData.tableItems.push({
							ACTION_ID : item.ACTION_ID,
							CHANNEL_ID : item.CHANNEL_ID,
							NAME : item.NAME,
							EXECUTION_ORDER : item.EXECUTION_ORDER
						});

						acoesModel.setData(oCoesModelData);

					}
				},
				error : function(oResponseSucess) {

				}
			});

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.CHANNEL_ID, sObjectName = oObject.NAME;

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [ sObjectName ]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [ sObjectId ]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [ sObjectName, sObjectId, location.href ]));
		},

		onUp : function() {

			var oViewModel = this.getModel("objectView");
			var oTable = this.getView().byId("tblCoordenadas");
			var oItems = oTable.getSelectedItems();
			var items = oTable.getItems();
			var item = oTable.getSelectedItem();

			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData = acoesModel.getData();
			debugger;
			for (var i = 0; i < oItems.length; i++) {
				var item = oItems[i];
				var sPath = item.getBindingContextPath();
				var index = sPath.replace(/[^0-9\.]/g, '');
			}
			if (parseInt(index) > 0) {
				var aux;
				var ordemUp;
				var ordemDown;

				var indexNegativo = parseInt(index) - 1;
				var up = oCoesModelData.tableItems[index];
				var down = oCoesModelData.tableItems[indexNegativo];

				aux = up.EXECUTION_ORDER;
				up.EXECUTION_ORDER = down.EXECUTION_ORDER;
				debugger;
				item.setSelected(false);
				
				down.EXECUTION_ORDER = aux;
//				oTable.setSelectedItem(index-1);
				
				oCoesModelData.tableItems[index] = down;
				items[indexNegativo].setSelected(true);
				oCoesModelData.tableItems[indexNegativo] = up;	
//				oCoesModelData.tableItems[index].setSelected(true);
				
				acoesModel.setData(oCoesModelData);
				oTable.getBinding("items").refresh();				
			}

		},

		onGravar : function() {
			var that = this;
			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData = acoesModel.getData();
			var oModel = this.getModel();

			var oItems = oCoesModelData.tableItems;
			debugger;
			for (var i = 0; i < oItems.length; i++) {
				var itemsModel = {};
				var item = oItems[i];
				itemsModel.ACTION_ID = item.ACTION_ID;
				itemsModel.CHANNEL_ID = item.CHANNEL_ID;
				itemsModel.NAME = item.NAME;
				itemsModel.EXECUTION_ORDER = item.EXECUTION_ORDER;

				oModel.update("/actionExecOrderOData(" + item.ACTION_ID + ")", itemsModel, {
					merge : false,
					success : function(oData, response) {
						debugger;
						that.onNavBack();
					},
					error : function(oResponseError) {
						debugger;
					}
				});
			}

		},
		onCancelar : function() {
			this.getView().unbindElement();
			this.onNavBack();
		},
		onDown : function() {

			var oViewModel = this.getModel("objectView");
			var oTable = this.getView().byId("tblCoordenadas");
			var oItems = oTable.getSelectedItems();
			var items = oTable.getItems();
			var itemSelect = oTable.getSelectedItem();
			var oTotalItem = oTable.getItems();
			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData = acoesModel.getData();

			for (var i = 0; i < oItems.length; i++) {
				var item = oItems[i];
				var sPath = item.getBindingContextPath();
				var index = sPath.replace(/[^0-9\.]/g, '');
			}

			if (index < oCoesModelData.tableItems.length) {
				var aux;
				var ordemUp;
				var ordemDown;

				var indexNegativo = parseInt(index) + 1;
				var up = oCoesModelData.tableItems[index];
				var down = oCoesModelData.tableItems[indexNegativo];
				aux = up.EXECUTION_ORDER;
				up.EXECUTION_ORDER = down.EXECUTION_ORDER;
				debugger;
				down.EXECUTION_ORDER = aux;
				itemSelect.setSelected(false);
				oCoesModelData.tableItems[index] = down;
				oCoesModelData.tableItems[indexNegativo] = up;
				items[indexNegativo].setSelected(true);
				
				oTotalItem[index] = down;
				oTotalItem[indexNegativo] = up;
				oTable.getBinding("items").refresh();			
			}

		},

	});

});