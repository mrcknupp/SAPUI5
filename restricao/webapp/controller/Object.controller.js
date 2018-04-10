/*global location*/
sap.ui.define([
	"com/cpfl/restricao/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"com/cpfl/restricao/model/formatter"
], function(BaseController, JSONModel, History, formatter) {
	"use strict";
	
	var that;
	return BaseController.extend("com.cpfl.restricao.controller.Object", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				btProcessarVisible: true,
				btSalvarVisible: false,
				btApagarVisible: false,
				btCancelarVisible: false,
				formEditable: false,
				isNew: false,
				fragmentIndividualVisible: false,
				fragmentAreaRiscoVisible: false,
				fragmentCNAEVisible: false,
				tipoRestricaoSelectedKey: -1

			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
			
			that = this;
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("objectView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},
		/**
		 * Event handler  for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function() {
			var oViewModel = this.getModel("objectView");
			//Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			var sPreviousHash = History.getInstance().getPreviousHash();
			//	oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined ) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			debugger;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("RestricaoOData", {
					RESTRICTION_ID: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},
		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function(sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oDataModel.metadataLoaded().then(function() {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function() {
						var oView = that.getView();
						var oObject = oView.getBindingContext().getObject();
						var restrictionType = oObject.RESTRICTION_TYPE;
						if (restrictionType === "INDIVIDUAL") {
							oViewModel.setProperty("/tipoRestricaoSelectedKey", 0);
						}
						if (restrictionType === "LOCATION") {
							oViewModel.setProperty("/tipoRestricaoSelectedKey", 1);
						}
						if (restrictionType === "CNAE") {
							oViewModel.setProperty("/tipoRestricaoSelectedKey", 2);
						}
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_processObject: function(objectId) {

			this.getRouter().navTo("objectCreate", {
				objectId: objectId
			});
		},
		_onBindingChange: function() {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			var oObject = oView.getBindingContext().getObject();
			var restrictionType = oObject.RESTRICTION_TYPE;
			debugger;
			if (restrictionType === "INDIVIDUAL") {
				oViewModel.setProperty("/tipoRestricaoSelectedKey", 0);
				oViewModel.setProperty("/fragmentIndividualVisible", true);
				oViewModel.setProperty("/fragmentAreaRiscoVisible", false);
				oViewModel.setProperty("/fragmentCNAEVisible", false);
			}
			debugger;
			if (restrictionType === "LOCATION") {
				oViewModel.setProperty("/tipoRestricaoSelectedKey", 1);
				oViewModel.setProperty("/fragmentIndividualVisible", false);
				oViewModel.setProperty("/fragmentAreaRiscoVisible", true);
				oViewModel.setProperty("/fragmentCNAEVisible", false);
				oView.byId("inputAreaRiscoUF").setValue(oObject.REGION);
				oView.byId("inputAreaRiscoUF").setDescription(oObject.REGION_NAME);
				
				oView.byId("inputAreaRiscoMunicipio").setValue(oObject.CITY_CODE);
				oView.byId("inputAreaRiscoMunicipio").setDescription(oObject.CITY_TEXT);
				
				oView.byId("inputAreaRiscoBairro").setValue(oObject.CITYP_CODE);
				oView.byId("inputAreaRiscoBairro").setDescription(oObject.CITYP_TEXT);
				debugger;
//				oView.byId("inputAreaRiscoLogradouro").setValue(oObject.STREET_CODE);
				
		        	
			}
			if (restrictionType === "CNAE") {
				oViewModel.setProperty("/tipoRestricaoSelectedKey", 2);
				oViewModel.setProperty("/fragmentIndividualVisible", false);
				oViewModel.setProperty("/fragmentAreaRiscoVisible", false);
				oViewModel.setProperty("/fragmentCNAEVisible", true);
			}
			// Everything went fine.
			oViewModel.setProperty("/busy", false);
		},

		/**
		 *@memberOf com.cpfl.restricao.controller.Object
		 */
		onProcessar: function() {
			var oViewModel = this.getModel("objectView");
			//Ajusta os botões
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/isNew", false);
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", true);
			oViewModel.setProperty("/btApagarVisible", true);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/formEditable", false);
			var model = {};
			
			model.objectId = this.byId("inputRestrictionId").getValue();
			model.inputDescription = this.byId("inputDescription").getValue();
			model.inputReason = this.byId("inputReason").getSelectedKey();
			model.inputValDesde = this.byId("inputValDesde").getValue();
			model.inputValAte = this.byId("inputValAte").getValue();
			model.inputNome = this.byId("inputNome").getValue();
			model.inputTipoRestricao = oViewModel.getProperty("/tipoRestricaoSelectedKey");
			model.inputTipoRestricaoInv = this.byId("inputTipoRestricao");
			model.inputIndividualContaContrato = this.byId("inputIndividualContaContrato").getValue();
			model.inputIndividualParceiro = this.byId("inputIndividualParceiro").getValue();
			model.inputIndividualInstalacao = this.byId("inputIndividualInstalacao").getValue();
			model.inputCnaeCnae = this.byId("inputCnaeCnae").getValue();
			model.inputAreaRiscoUF = this.byId("inputAreaRiscoUF").getValue();
			model.inputAreaRiscoMunicipio = this.byId("inputAreaRiscoMunicipio").getValue();
			model.inputAreaRiscoBairro = this.byId("inputAreaRiscoBairro").getValue();
			model.inputAreaRiscoLogradouro = this.byId("inputAreaRiscoLogradouro").getValue();

			model.itensAcao = [];
			var itens = this.byId("tableAcoes").getItems();
			for (var i = 0; i < itens.length; i++) {
				var item = itens[i];
				var itemObject = item.getBindingContext().getObject();
				
				model.itensAcao.push({
					codEmpresa: itemObject.BUKRS,
					descEmpresa: itemObject.BUTXT,
					codAcao: itemObject.ACTION_ID,
					DescAcao: itemObject.NAME
				});
			}
			var jsonModel = new sap.ui.model.json.JSONModel(model);
			sap.ui.getCore().setModel(jsonModel, "editModel");
			this._processObject(model.objectId);
		},
	    onCNAE : function(){

			var oInput = this.getView().byId("inputCnaeCnae");
			var oViewModel = this.getModel("objectView");
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idCnaetHelp", {
				supportMultiselect : false,
				title : "CNAE",
//				key : "IND_SECTOR",
				descriptionKey : "TEXT",
				ok : function(oEventTipo) {
					var aTokens = oEventTipo.getParameter("tokens");

					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setValue(token.getText);
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
				cols : [
					{
						label : "Código do CNAE",
						template : "IND_SECTOR"
					},					
					{
						label : "Nome",
						template : "TEXT"
					} 
					]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");
			oTable.setModel(this.getModel());
			oTable.bindRows("/cnaeOData");
			oValueHelp.open();
			oValueHelp.update();	    	
	    },
		/**
		 *@memberOf com.cpfl.restricao.controller.Object
		 */
		onSelectTipoRestricao: function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var teste = oEvent.getParameter("selectedIndex");

			switch (teste) {
				case 0:
					oViewModel.setProperty("/fragmentIndividualVisible", true);
					oViewModel.setProperty("/fragmentAreaRiscoVisible", false);
					oViewModel.setProperty("/fragmentCNAEVisible", false);
					break;
				case 1:
					oViewModel.setProperty("/fragmentIndividualVisible", false);
					oViewModel.setProperty("/fragmentAreaRiscoVisible", true);
					oViewModel.setProperty("/fragmentCNAEVisible", false);
					break;
				case 2:
					oViewModel.setProperty("/fragmentIndividualVisible", false);
					oViewModel.setProperty("/fragmentAreaRiscoVisible", false);
					oViewModel.setProperty("/fragmentCNAEVisible", true);
					break;

			}

		}
	});
});