/*global location*/
sap.ui.define([ "acao/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "acao/model/formatter" ], function(BaseController, JSONModel, History, formatter, MessageBox, MessageToast) {
	"use strict";
	return BaseController.extend("acao.controller.Object", {
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
			// Model used to manipulate control states. The chosen
			// values make sure,
			// detail page is busy indication immediately so there is
			// no break in
			// between the busy indication for loading the view's meta
			// data
			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				btProcessarVisible : true,
				btSalvarVisible : false,
				btApagarVisible : false,
				btCancelarVisible : false,
				formEditable : false,
				mensalVisible : false,
				diariaVisible : true,
				semanalVisible : false,
				isNew : false,
				tipoSelecao : false,
				validar : true,
				validar2 : true,
				viewTitle : "{i18n>editViewTitle}",
				identificador : "",
				// channelId : null,
				// tipoId : null,
				// modeloId : null,
				tipoVisible : false,
				buttonVisible : false,
				dateVisible : false,
				servicoCampo : ""
			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator delay, so it can be
			// restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore original busy indicator delay for the
				// object view
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
		 * previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the
		 * worklist route.
		 * 
		 * @public
		 */
		onNavBack : function() {
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/buttonVisible", false);
			oViewModel.setProperty("/isNew", false);
			var sPreviousHash = History.getInstance().getPreviousHash();
			this.getView().unbindElement();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		clearObject : function() {
			this.getView().byId("comboEmpresa").setSelectedKey("");
			this.getView().byId("inNomeAcao").setValue("");
			this.getView().byId("inDescricao").setValue("");
			this.getView().byId("inValidoDesde").setValue("");
			this.getView().byId("inValidoAte").setValue("");
			this.getView().byId("radioDiario").setSelected(true);
			this.getView().byId("radioSemanal").setSelected(false);
			this.getView().byId("radioMensal").setSelected(false);
			this.getView().byId("chkDSabado").setSelected(false);
			this.getView().byId("chkDDomingo").setSelected(false);
			this.getView().byId("chkDFeriado").setSelected(false);
			this.getView().byId("chkSDomingo").setSelected(false);
			this.getView().byId("chkSSegunda").setSelected(false);
			this.getView().byId("chkSTerca").setSelected(false);
			this.getView().byId("chkSQuarta").setSelected(false);
			this.getView().byId("chkSQuinta").setSelected(false);
			this.getView().byId("chkSSexta").setSelected(false);
			this.getView().byId("chkSSabado").setSelected(false);
			this.getView().byId("inMensal").setValue(null);
			this.getView().byId("chkCampanha").setSelected(false);
			this.getView().byId("chkSelecaoFinal").setSelected(false);
			this.getView().byId("inCanalNot").setValue("");
			// this.getView().byId("chkSelecao").setSelected(false);
			this.getView().byId("inHelpTipo").setValue("");
//			this.getView().byId("inModeloPre").setValue("");
			this.getView().byId("inCanalNot").destroyTokens();
//			this.getView().byId("inModeloPre").destroyTokens();
			this.getView().byId("inHelpTipo").destroyTokens();
			this.onRadioPress();

		},
		/* =========================================================== */
		/* internal methods */
		/* =========================================================== */
		/**
		 * Binds the view to the object path.
		 * 
		 * @function
		 * @param {sap.ui.base.Event}
		 *          oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var oViewModel = this.getModel("objectView");
			var chave = sObjectId.split("#");

			for (var i = 0; i < chave.length; i++) {
				var key = chave[0];
				var data = chave[1];
			}

			if (sObjectId === "Novo") {

				this.clearObject();
				oViewModel.setProperty("/identificador", "Novo");
				oViewModel.setProperty("/dateVisible", false);
				var oView = this.getView();
				this.onProcessar();
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/isNew", true);
				oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("createViewTitle"));
				var bindingContext = oView.getBindingContext();
				if (bindingContext) {
					this.getView().unbindElement();
				}
				this.getModel().metadataLoaded().then(function() {
					var oEntry = oView.getModel().createEntry("acaoOData");
					oView.setBindingContext(oEntry);
				}.bind(this));
				oViewModel.setProperty("/busy", false);

			} else {
				oViewModel.setProperty("/dateVisible", true);
				oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("editViewTitle"));
				oViewModel.setProperty("/identificador", key);
				oViewModel.setProperty("/btProcessarVisible", true);
				oViewModel.setProperty("/btSalvarVisible", false);
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/btCancelarVisible", false);
				oViewModel.setProperty("/formEditable", false);
				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("acaoOData", {
						ACTION_ID : key,
						VALID_FROM : data
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));
			}

		},
		/**
		 * Binds the view to the object path.
		 * 
		 * @function
		 * @param {string}
		 *          sObjectPath path to the object to be bound
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
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived : function() {
						var oView = this.getView();
						var oObject = oView.getBindingContext().getObject();
						var periodicityType = oObject.TRIGGER_PERIODICITY;

						if (periodicityType === "D") {
							oViewModel.setProperty("/diariaVisible", true);
							oViewModel.setProperty("/semanalVisible", false);
							oViewModel.setProperty("/mensalVisible", false);
						}
						if (periodicityType === "S") {
							oViewModel.setProperty("/diariaVisible", false);
							oViewModel.setProperty("/semanalVisible", true);
							oViewModel.setProperty("/mensalVisible", false);
						}
						if (periodicityType === "M") {
							oViewModel.setProperty("/diariaVisible", false);
							oViewModel.setProperty("/semanalVisible", false);
							oViewModel.setProperty("/mensalVisible", true);
						}

						oViewModel.setProperty("/busy", false);

					}
				}
			});
		},
		_onBindingChange : function() {
			var oView = this.getView(), oViewModel = this.getModel("objectView"), oElementBinding = oView.getElementBinding();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.ACTION_ID, sObjectName = oObject.NAME;
			var isNew = oViewModel.getProperty("/isNew");
			if (isNew === false) {
				var value = oObject.VALUE_DISTRIBUTION * 100;
				this.getView().byId("inDistCanal").setValue(value);
				
				this.getView().byId("inCanalNot").destroyTokens();
				var oToken = new sap.m.Token();
				if (oObject.CHANNEL_ID) {
					oToken.setKey(oObject.CHANNEL_ID);
					oToken.setText(oObject.CHANNEL_NAME);
					this.getView().byId("inCanalNot").addToken(oToken);
				}
/*				this.getView().byId("inModeloPre").destroyTokens();
				if (oObject.PREDICTIVE_MODEL_ID) {
					var oToken2 = new sap.m.Token();
					oToken2.setKey(oObject.PREDICTIVE_MODEL_ID);
					oToken2.setText(oObject.PREDICTIVE_MODEL_NAME);
					this.getView().byId("inModeloPre").addToken(oToken2);
				}*/
				this.getView().byId("inHelpTipo").destroyTokens();
				if (oObject.CAMP_SELECTION_ID) {
					var oToken3 = new sap.m.Token();
					oToken3.setKey(oObject.CAMP_SELECTION_ID);
					oToken3.setText(oObject.CAMP_SELECTION_NAME);
					this.getView().byId("inHelpTipo").addToken(oToken3);
				}

			}
			var oModel = this.getModel();
			var periodicityType = oObject.TRIGGER_PERIODICITY;
			var Segunda = oObject.TRIGGER_MON;
			var Terca = oObject.TRIGGER_TUE;
			var Quarta = oObject.TRIGGER_WED;
			var Quinta = oObject.TRIGGER_THU;
			var Sexta = oObject.TRIGGER_FRI;
			var Sabado = oObject.TRIGGER_SAT;
			var Domingo = oObject.TRIGGER_SUN;
			var Feriado = oObject.TRIGGER_HOLIDAY;
			var campanhaBox = oObject.IF_CAMPAIGN;
			var selecaoFinalBox = oObject.IF_AUTO_SELECTION;

			if (campanhaBox) {
				this.getView().byId("chkCampanha").setSelected(true);
			} else {
				this.getView().byId("chkCampanha").setSelected(false);
			}

			if (selecaoFinalBox) {
				this.getView().byId("chkSelecaoFinal").setSelected(true);
			} else {
				this.getView().byId("chkSelecaoFinal").setSelected(false);
			}

			if (periodicityType === "D") {
				this.getView().byId("radioDiario").setSelected(true);
				this.getView().byId("radioSemanal").setSelected(false);
				this.getView().byId("radioMensal").setSelected(false);
				oViewModel.setProperty("/diariaVisible", true);
				oViewModel.setProperty("/semanalVisible", false);
				oViewModel.setProperty("/mensalVisible", false);

				if (Domingo) {
					this.getView().byId("chkDDomingo").setSelected(true);
				}
				if (Sabado) {
					this.getView().byId("chkDSabado").setSelected(true);
				}
				if (Feriado) {
					this.getView().byId("chkDFeriado").setSelected(true);
				}

			}
			if (periodicityType === "S") {
				this.getView().byId("radioDiario").setSelected(false);
				this.getView().byId("radioSemanal").setSelected(true);
				this.getView().byId("radioMensal").setSelected(false);
				oViewModel.setProperty("/diariaVisible", false);
				oViewModel.setProperty("/semanalVisible", true);
				oViewModel.setProperty("/mensalVisible", false);

				if (Domingo) {
					this.getView().byId("chkDDomingo").setSelected(true);
				}
				if (Sabado) {
					this.getView().byId("chkDSabado").setSelected(true);
				}
				if (Segunda) {
					this.getView().byId("chkSSegunda").setSelected(true);
				}
				if (Terca) {
					this.getView().byId("chkSTerca").setSelected(true);
				}
				if (Quarta) {
					this.getView().byId("chkSQuarta").setSelected(true);
				}
				if (Quinta) {
					this.getView().byId("chkSQuinta").setSelected(true);
				}
				if (Sexta) {
					this.getView().byId("chkSSexta").setSelected(true);
				}
			}
			if (periodicityType === "M") {
				this.getView().byId("radioDiario").setSelected(false);
				this.getView().byId("radioSemanal").setSelected(false);
				this.getView().byId("radioMensal").setSelected(true);
				oViewModel.setProperty("/diariaVisible", false);
				oViewModel.setProperty("/semanalVisible", false);
				oViewModel.setProperty("/mensalVisible", true);
			}
			debugger;
			if (oObject.CHANNEL_ID) {
				var where = parseInt(oObject.CHANNEL_ID);
				var filters = new Array();
				var filterByID = new sap.ui.model.Filter("CHANNEL_ID", sap.ui.model.FilterOperator.EQ, where);
				filters.push(filterByID);
				oModel.read("/canalNotificacaoOData", {
					filters : filters,
					success : function(oResponseSucess) {
						var campService;
						for (var i = 0; i < oResponseSucess.results.length; i++) {
							campService = oResponseSucess.results[i].IF_CAMP_SERVICE;
						}

						if (campService) {
							oViewModel.setProperty("/tipoVisible", true);
						} else {
							oViewModel.setProperty("/tipoVisible", false)
						}
					},
					error : function(oResponseSucess) {
					}
				});

				oViewModel.setProperty("/tipoVisible", true);
			} else {
				oViewModel.setProperty("/tipoVisible", false);
			}

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [ sObjectName ]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [ sObjectId ]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [ sObjectName, sObjectId, location.href ]));
		},
		/**
		 * @memberOf acao.controller.Object
		 */
		onCancelar : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", true);
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/tipoSelecao", false);
			oViewModel.setProperty("/buttonVisible", false);
			oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("editViewTitle"));
			this.getView().unbindElement();
			this.onNavBack();
		},
		/**
		 * @memberOf acao.controller.Object
		 */
		onDeletar : function() {
			var oComponent = this.getOwnerComponent(), oModel = this.getModel();
			var that = this;
			var oViewModel = this.getModel("objectView");
			var action_id = oViewModel.getProperty("/identificador");
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern : "dd/MM/yyyy"
			});

			var strDataDesde = dateFormat.parse(this.byId("inValidoDesde").getValue());
			var date = new Date(strDataDesde);
			var valid_from = date.toISOString();
			var subvalid_from = valid_from.substring(0, 11);
			var horas = "00:00:00.0000000";
			valid_from = subvalid_from + horas;

			sap.m.MessageBox.confirm("Deseja excluir ?", {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// Apaga o registro
						var jsonModel = sap.ui.getCore().getModel("editModel");
						var sPath = "/acaoOData(ACTION_ID=" + action_id + ",VALID_FROM=datetime'" + valid_from + "')";
						oModel.remove(sPath);
						// Volta para a tela inicial
						that.onNavToWorklist();
					}
				}
			});

		},
		/**
		 * @memberOf acao.controller.Object
		 */
		_validateObject : function() {
			var oViewModel = this.getModel("objectView");
			var required = oViewModel.getProperty("/tipoSelecao");
			var required2 = oViewModel.getProperty("/inMensal");
			oViewModel.setProperty("/validar", true);

			var diaria = this.byId("radioDiario").getSelected(), semanal = this.byId("radioSemanal").getSelected();
//			var oTokens2 = this.getView().byId("inModeloPre").getTokens();

			var empresa = this.getView().byId("comboEmpresa").getSelectedKey();
			if (empresa === "") {
				var msg3 = this.getView().getModel("i18n").getResourceBundle().getText("msgObrigatorio");
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(msg3, {
					of : this.getView().byId("comboEmpresa")
				});
				oViewModel.setProperty("/validar", false);
				return;
			}

			var name = this.getView().byId("inNomeAcao").getValue();
			if (name === "") {
				var msg4 = this.getView().getModel("i18n").getResourceBundle().getText("msgObrigatorio");
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(msg4, {
					of : this.getView().byId("inNomeAcao")
				});
				oViewModel.setProperty("/validar", false);
				return;
			}

			var oTokens = this.getView().byId("inCanalNot").getTokens();
			if (oTokens.length === 0) {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgObrigatorio"), {
					of : this.getView().byId("inCanalNot")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			if (semanal) {
				if (this.byId("chkSSegunda").getSelected() === false && this.byId("chkSTerca").getSelected() === false && this.byId("chkSQuarta").getSelected() === false && this.byId("chkSQuinta").getSelected() === false && this.byId("chkSSexta").getSelected() === false
						&& this.byId("chkSSabado").getSelected() === false && this.byId("chkSDomingo").getSelected() === false) {
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgVPerioMensal"), {
						of : this.getView().byId("radioSemanal")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}

			}

			var oTokens3 = this.getView().byId("inCanalNot").getTokens();
			var oTokens4 = this.getView().byId("inHelpTipo").getTokens();
			if (oViewModel.getProperty("/servicoCampo")) {
				if (oTokens3.length > 0 && oTokens4.length === 0) {
					var msg = this.getView().getModel("i18n").getResourceBundle().getText("msgTipoSelecao");
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(msg, {
						of : this.getView().byId("inHelpTipo")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}
			}

			if (this.getView().byId("radioMensal").getSelected()) {
				var mensal = this.getView().byId("inMensal").getValue();
				if (mensal === "") {
					var msg2 = this.getView().getModel("i18n").getResourceBundle().getText("msgRadioMensal");
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(msg2, {
						of : this.getView().byId("inMensal")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}
			}
//	SIR 6193 - Thiago César - 17/05/2017 - Início
//			if (oTokens2.length === 0) {
//				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgObrigatorio"), {
//					of : this.getView().byId("inModeloPre")
//				});
//				oViewModel.setProperty("/validar", false);
//				return;
//
//			}
			if (this.getView().byId("inDistCanal").getValue() > 100) {
				var msg4 = this.getView().getModel("i18n").getResourceBundle().getText("msgErroTamanho");
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(msg4, {
					of : this.getView().byId("inDistCanal")
				});
				oViewModel.setProperty("/validar", false);
				return;
			}			
//			SIR 6193 - Thiago César - 17/05/2017 - Fim			

		},

		onNavToWorklist : function() {
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", true);
			oViewModel.setProperty("/btApagarVisible", true);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/isNew", false);

			this.getRouter().navTo("worklist", {}, true);
		},

		onClickCanal : function() {
			window.open("/accs/ui5/canalnot/webapp", "_blank");
		},

		onClickModelo : function() {
			window.open("/accs/ui5/modeloPreditivo/webapp", "_blank");
		},

		onConvertDateTime : function(dateFrom) {
			var valid_from = new Date(this.byId("dtValidFrom").getValue());
			var dateFormat = valid_from.toISOString();
			var array = dateFormat.split("000Z");
			var date = array[0] + "0000000";
			var arrayT = date.split("T");
			var arrayD = arrayT[0].split("-");
			return dateFrom = arrayD[0] + "-" + arrayD[2] + "-" + arrayD[1] + "T" + arrayT[1];
		},

		onGravar : function() {

			this._validateObject();

			var that = this;
			var oModel = this.getModel();
			var oView = this.getView();
			var oViewModel = this.getModel("objectView");
			// oViewModel.setProperty("/busy", true);
			var isNew = oViewModel.getProperty("/isNew");
			var model = {};
			var diaria, semanal, mensal;
			var ok = oViewModel.getProperty("/validar");
			if (ok) {
				model.ACTION_ID = oViewModel.getProperty("/identificador");
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern : "dd/MM/yyyy"
				});

				if (this.byId("inValidoDesde").getValue()) {
					var strDataDesde = dateFormat.parse(this.byId("inValidoDesde").getValue());
					model.VALID_FROM = new Date(strDataDesde);

				} else {
					model.VALID_FROM = new Date();
				}

				if (this.byId("inValidoAte").getValue()) {
					var strDataAte = dateFormat.parse(this.byId("inValidoAte").getValue());
					model.VALID_UNTIL = new Date(strDataAte);
				} else {
					model.VALID_UNTIL = new Date();
				}

				var oTokenCanal = this.getView().byId('inCanalNot').getTokens();
				for (var i = 0; i < oTokenCanal.length; i++) {
					var token = oTokenCanal[i];
					model.CHANNEL_ID = token.getKey();
					model.CHANNEL_NAME = token.getText();
				}

				model.BUKRS = this.byId("comboEmpresa").getSelectedKey();
				model.BUTXT = "";
//				SIR 6193 - Thiago César - 17/05/2017 - Início
				debugger;
				if (this.getView().byId("inDistCanal").getValue() === 0){
					model.VALUE_DISTRIBUTION = 0;
				}else{
					var value = parseFloat(this.getView().byId("inDistCanal").getValue() / 100).toFixed(6);

					model.VALUE_DISTRIBUTION = 	value.toString();
				}
			
//				var oTokenModelo = this.getView().byId('inModeloPre').getTokens();
//				if(oTokenModelo.length > 0){
//					for (var i = 0; i < oTokenModelo.length; i++) {
//						var token2 = oTokenModelo[i];
//						model.PREDICTIVE_MODEL_ID = token2.getKey();
//						model.PREDICTIVE_MODEL_NAME = token2.getText();
//					}					
//				}else{
//					model.PREDICTIVE_MODEL_ID = 0;
//					model.PREDICTIVE_MODEL_NAME = "";					
//				}

//				SIR 6193 - Thiago César - 17/05/2017 - Fim					
				// if (this.getView().byId("chkSelecao").getSelected()) {
				var oTokenTipo = this.getView().byId('inHelpTipo').getTokens();
				if (oTokenTipo.length > 0) {
					for (var i = 0; i < oTokenTipo.length; i++) {
						var token3 = oTokenTipo[i];
						model.CAMP_SELECTION_ID = token3.getKey();
						model.CAMP_SELECTION_NAME = token3.getText();
					}

				} else {
					model.CAMP_SELECTION_ID = null;
					model.CAMP_SELECTION_NAME = null;
				}

				model.NAME = this.byId("inNomeAcao").getValue();
				model.DESCRIPTION = this.byId("inDescricao").getValue();

				diaria = this.byId("radioDiario").getSelected();
				semanal = this.byId("radioSemanal").getSelected();
				mensal = this.byId("radioMensal").getSelected();

				model.TRIGGER_MON = 0;
				model.TRIGGER_TUE = 0;
				model.TRIGGER_WED = 0;
				model.TRIGGER_THU = 0;
				model.TRIGGER_FRI = 0;
				model.TRIGGER_SAT = 0;
				model.TRIGGER_SUN = 0;
				model.TRIGGER_HOLIDAY = 0;

				if (diaria) {
					model.TRIGGER_PERIODICITY = "D";
					model.TRIGGER_NAME = "Diário"

					model.TRIGGER_MON = 1;
					model.TRIGGER_TUE = 1;
					model.TRIGGER_WED = 1;
					model.TRIGGER_THU = 1;
					model.TRIGGER_FRI = 1;

					if (this.byId("chkDSabado").getSelected()) {
						model.TRIGGER_SAT = 1;
					}
					if (this.byId("chkDDomingo").getSelected()) {
						model.TRIGGER_SUN = 1;
					}

					if (this.byId("chkDFeriado").getSelected()) {
						model.TRIGGER_HOLIDAY = 1;
					}

				}

				if (semanal) {
					model.TRIGGER_PERIODICITY = "S";
					model.TRIGGER_NAME = "Semanal";

					if (this.byId("chkSSegunda").getSelected()) {
						model.TRIGGER_MON = 1;
					}
					if (this.byId("chkSTerca").getSelected()) {
						model.TRIGGER_TUE = 1;
					}
					if (this.byId("chkSQuarta").getSelected()) {
						model.TRIGGER_WED = 1;
					}
					if (this.byId("chkSQuinta").getSelected()) {
						model.TRIGGER_THU = 1;
					}
					if (this.byId("chkSSexta").getSelected()) {
						model.TRIGGER_FRI = 1;
					}
					if (this.byId("chkSSabado").getSelected()) {
						model.TRIGGER_SAT = 1;
					}
					if (this.byId("chkSDomingo").getSelected()) {
						model.TRIGGER_SUN = 1;
					}
				}

				if (mensal) {
					model.TRIGGER_PERIODICITY = "M";
					model.TRIGGER_NAME = "Mensal";
					model.TRIGGER_DAY_MONTH = this.byId("inMensal").getValue();
				} else {
					model.TRIGGER_DAY_MONTH = null;
				}

				if (this.byId("chkCampanha").getSelected()) {
					model.IF_CAMPAIGN = "1";
				} else {
					model.IF_CAMPAIGN = "0";
				}

				if (this.byId("chkSelecaoFinal").getSelected()) {
					model.IF_AUTO_SELECTION = "1";
				} else {
					model.IF_AUTO_SELECTION = "0";
				}
				model.EXECUTION_ORDER = "1";
//				model.VALUE_DISTRIBUTION = "1";

				model.USR01_BNAME = "CT16030";

				// var that = this;
				if (isNew) {
					var genId = oModel.read("/genActionId", {
						success : function(oResponseSucess) {

							model.ACTION_ID = oResponseSucess.results[0].GEN_ACTION_ID;

							// Salva o registro
							console.log(JSON.stringify(model));
							oModel.create("/acaoOData", model, {
								async : false,
								success : function(oData, response) {
									sap.m.MessageBox.information("Registro salvo com sucesso!");
									oModel.refresh();
									that.onNavBack();
								},
								error : function(oResponseError) {
								}
							});
						},
						error : function(oError) {
							sap.ui.commons.MessageBox.alert("Erro ao gerar ID");
							this.onNavBack();
						}
					});

				} else {
					debugger;
					var valid_from = model.VALID_FROM.toISOString();
					var data = valid_from.substring(0, 11);
					var time = '00:00:00.0000000', valid_from = data + time;
					debugger;
					oModel.update("/acaoOData(ACTION_ID=" + model.ACTION_ID + ",VALID_FROM=datetime'" + valid_from + "')", model, {
						merge : false,
						success : function(oData, response) {
							debugger;
							that.getView().byId("inCanalNot").destroyTokens();
							that.getView().byId("inHelpTipo").destroyTokens();
//							that.getView().byId("inModeloPre").destroyTokens();
							sap.m.MessageBox.information("Registro alterado com sucesso!");
							oModel.refresh();
							that.onNavBack();
						},
						error : function(oResponseError) {
							var xmlDoc = jQuery.parseXML(oResponseError.responseText);
							var txtErro = xmlDoc.getElementsByTagName("DETAIL")[0].childNodes[0];

							MessageBox.error(txtErro.data, {
								id : "serviceErrorMessageBox",
								details : xmlDoc.getElementsByTagName("message")[0].childNodes[0].data,
								actions : [ MessageBox.Action.CLOSE ],
								onClose : function() {
									oViewModel.setProperty("/busy", false);
								}.bind(this)
							});
						}
					});
				}
			}

		},

		/**
		 * @memberOf acao.controller.Object
		 */
		onProcessar : function() {
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", true);
			oViewModel.setProperty("/btApagarVisible", true);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/formEditable", true);
			oViewModel.setProperty("/isNew", false);
			oViewModel.setProperty("/buttonVisible", true);
			oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("changeViewTitle"));
		},

		_processObject : function(objectId) {

			this.getRouter().navTo("objectCreate", {
				objectId : objectId
			});
		},
		/**
		 * @memberOf acao.controller.Object
		 */
		// onCheckTipo : function() {
		// debugger;
		// // This code was generated by the layout editor.
		// var oViewModel = this.getModel("objectView");
		// var checked = this.getView().byId("chkSelecao").getSelected();
		// if (checked === false) {
		// oViewModel.setProperty("/tipoVisible", false);
		// this.getView().byId("inHelpTipo").destroyTokens();
		// } else {
		// oViewModel.setProperty("/tipoVisible", true);
		// }
		// },
		/**
		 * @memberOf acao.controller.Object
		 */
		onRadioPress : function() {
			this.getView().unbindElement("radioDiario");
			this.getView().unbindElement("radioMensal");
			this.getView().unbindElement("radioSemanal");
			// This code was generated by the layout editor.
			var radioDiario = this.getView().byId("radioDiario").getSelected();
			var radioMensal = this.getView().byId("radioMensal").getSelected();
			var radioSemanal = this.getView().byId("radioSemanal").getSelected();
			var oViewModel = this.getModel("objectView");
			if (radioDiario === true) {
				// Diária
				oViewModel.setProperty("/diariaVisible", true);
				// Semanal
				oViewModel.setProperty("/semanalVisible", false);
				// Mensal
				oViewModel.setProperty("/mensalVisible", false);
				oViewModel.setProperty("/inMensal", false);
			}
			if (radioSemanal === true) {
				// Diária
				oViewModel.setProperty("/diariaVisible", false);
				// Semanal
				oViewModel.setProperty("/semanalVisible", true);
				// Mensal
				oViewModel.setProperty("/mensalVisible", false);
				oViewModel.setProperty("/inMensal", false);
			}
			if (radioMensal === true) {
				// Diária
				oViewModel.setProperty("/diariaVisible", false);
				// Semanal
				oViewModel.setProperty("/semanalVisible", false);
				// Mensal
				oViewModel.setProperty("/mensalVisible", true);
				oViewModel.setProperty("/inMensal", true);
				oViewModel.setProperty("/semanalSelected", false);
				oViewModel.setProperty("/diariaSelected", false);
			}
		},

		onChangeCanal : function() {
			var oViewModel = this.getModel("objectView");
			this.getView().byId("inHelpTipo").destroyTokens();
			oViewModel.setProperty("/tipoVisible", false);

		},
		/**
		 * @memberOf acao.controller.Object
		 */
		onEmpresaHelp : function() {
			var oInput = this.getView().byId("inEmpresa");
			var oValueEmpresa = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueHelp", {
				supportMultiselect : false,
				key : "BUKRS",
				descriptionKey : "BUTXT",
				ok : function(oEventEmpresa) {
					var aTokens = oEventEmpresa.getParameter("tokens");
					oInput.setTokens(aTokens);
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
					label : "Codigo da Empresa",
					template : "BUKRS"
				}, {
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
			oTable.bindRows("/Empresa_Odata");
			oValueEmpresa.setRangeKeyFields([ {
				label : "Codigo da Empresa",
				key : "BUKRS"
			}, {
				label : "Nome da Empresa",
				key : "BUTXT"
			} ]);
			oValueEmpresa.open();
		},
		/**
		 * @memberOf acao.controller.Object
		 */
//		onModeloHelp : function() {
//			// This code was generated by the layout editor.
//			var oInput2 = this.getView().byId("inModeloPre");
//			var oViewModel = this.getModel("objectView");
//			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueModelo", {
//				supportMultiselect : false,
//				title : "Modelo preditivo",
//				key : "PREDICTIVE_MODEL_ID",
//				descriptionKey : "NAME",
//				ok : function(oEventModel) {
//					var aTokens2 = oEventModel.getParameter("tokens");
//					oInput2.setTokens(aTokens2);
//					oValueHelp.close();
//				},
//				cancel : function() {
//					oValueHelp.close();
//				},
//				afterClose : function() {
//					oValueHelp.destroy();
//				}
//			});
//			var oColModel = new sap.ui.model.json.JSONModel();
//			oColModel.setData({
//				cols : [ {
//					label : "Codigo do Modelo",
//					template : "PREDICTIVE_MODEL_ID"
//				}, {
//					label : "Nome",
//					template : "NAME"
//				}, {
//					label : "Tipo do Modelo",
//					template : "TYPE_MODEL"
//				} ]
//			});
//			var oTable2 = oValueHelp.getTable();
//			oTable2.setModel(oColModel, "columns");
//			oTable2.setModel(this.getModel());
//			oTable2.bindRows("/modeloPreditivoOData");
//			oValueHelp.open();
//			oValueHelp.update();
//		},
		/**
		 * @memberOf acao.controller.Object
		 */
		onTipoHelp : function() {
			// This code was generated by the layout editor.
			var oInput = this.getView().byId("inHelpTipo");
			var oViewModel = this.getModel("objectView");
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueTipo", {
				supportMultiselect : false,
				title : "Tipo de seleção",
				key : "CAMP_SELECTION_ID",
				descriptionKey : "CAMP_SELECTION",
				ok : function(oEventTipo) {
					var aTokens = oEventTipo.getParameter("tokens");
					oInput.setTokens(aTokens);
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
					label : "Codigo da Seleção",
					template : "CAMP_SELECTION_ID"
				}, {
					label : "Nome",
					template : "CAMP_SELECTION"
				} ]
			});
			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");
			oTable.setModel(this.getModel());
			oTable.bindRows("/Campo_selecao_Odata");
			oValueHelp.open();
			oValueHelp.update();
		},
		/**
		 * @memberOf acao.controller.Object
		 */
		onCanalHelp : function() {
			// This code was generated by the layout editor.
			var oInput = this.getView().byId("inCanalNot");
			var oViewModel = this.getModel("objectView");
			var oModel = this.getModel();
			var that = this;
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueHelp3", {
				supportMultiselect : false,
				filterMode : true,
				title : "Canal de Notificação",
				key : "CHANNEL_ID",
				descriptionKey : "NAME",
				ok : function(oEventCanal) {
					var aTokens = oEventCanal.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						var key = token.getKey();
					}
					if (key) {
						var where = parseInt(key);
						var filters = new Array();
						var filterByID = new sap.ui.model.Filter("CHANNEL_ID", sap.ui.model.FilterOperator.EQ, where);
						filters.push(filterByID);
						oModel.read("/canalNotificacaoOData", {
							filters : filters,
							success : function(oResponseSucess) {
								var campService;
								for (var i = 0; i < oResponseSucess.results.length; i++) {
									campService = oResponseSucess.results[i].IF_CAMP_SERVICE;

								}

								if (campService) {
									oViewModel.setProperty("/tipoVisible", true);
									oViewModel.setProperty("/servicoCampo", true);
								} else {
									oViewModel.setProperty("/servicoCampo", false);
								}
								that.getView().byId("inHelpTipo").destroyTokens();
							},
							error : function(oResponseSucess) {

							}
						});

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
					label : "Codigo do Canal",
					template : "CHANNEL_ID"
				}, {
					label : "Nome",
					template : "NAME"
				}, {
					label : "Descrição",
					template : "DESCRIPTION"
				} ]
			});
			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");
			oTable.setModel(this.getModel());
			oTable.bindRows("/canalNotificacaoOData");
			oValueHelp.open();
			oValueHelp.update();
		}
	});
});