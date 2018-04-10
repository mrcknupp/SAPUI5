/*global location*/
sap.ui.define([ 
	"com/cpfl/distrib/controller/BaseController", 
	"sap/ui/model/json/JSONModel", 
	"sap/ui/core/routing/History", 
	"com/cpfl/distrib/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"], 
	function(
			BaseController, 
			JSONModel, 
			History, 
			formatter, 
			MessageBox, 
			MessageToast) {
	"use strict";

	return BaseController.extend("com.cpfl.distrib.controller.Object", {

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
				btProcessarVisible : true,
				btSalvarVisible : false,
				btApagarVisible : false,
				btCancelarVisible : false,
				formEditable : false,
				identificador : "",
				validar : true,
				dataValidade: "",
				actionID: 0,
				isNew : false
			});
			this.aItemsCidade = [];
			this.aItemsBairro = [];
			this.aItemsAcao = [];
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later
			// on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
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
		 * Binds the view to the object path.
		 * 
		 * @function
		 * @param {sap.ui.base.Event}
		 *            oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function(oEvent) {
			debugger;
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var oViewModel = this.getModel("objectView");
			var oModel = this.getModel();
			var oView = this.getView();
			var that = this;
			var chave = sObjectId.split("#");

			for (var i = 0; i < chave.length; i++) {
				var key = chave[0];
//				var data = chave[1];
			}			

			if (sObjectId === "Novo") {
				
				var oView = this.getView();
				this._clearObject();
				oViewModel.setProperty("/identificador", "Novo");
				this.onProcessar();
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/isNew", true);
				var bindingContext = oView.getBindingContext();
				if (bindingContext) {
					this.getView().unbindElement();
				}
			
				this.getModel().metadataLoaded().then(function() {
					var oEntry = oView.getModel().createEntry("distribuicaoOData");
					oView.setBindingContext(oEntry);
					var d = new Date();
					debugger;
					var mes = d.getMonth() + 1;
					var dateStr = d.getDate() + "/" + mes + "/" + d.getFullYear();
					this.byId("inValidoDesde").setValue(dateStr);
					this.byId("inValidoAte").setValue("31/12/9999");					
				}.bind(this));
				oViewModel.setProperty("/busy", false);
			} else {
//				debugger;
//				var oObject = oView.getBindingContext().getObject();				
//				var aTokensAcao;
//				aTokensAcao.setKey(oObject.ACTION_ID);
//				aTokensAcao.setText(oObject.ACTION_NAME);
//				this.byId("inAcao").setTokens(aTokensAcao);
//				
//				
				this.aItemsCidade = [];
				this.aItemsBairro = [];	
				this.aItemsAcao = [];
				debugger;
//				var dt1 = new Date(data.toString());
//				var day = dt1.getDate() + 1;
//				var month = dt1.getMonth() + 1;
//				var strDataDesde = day + "/" + month + "/" + dt1.getFullYear();
//				var date = new Date(strDataDesde);
//				var valid_from = date.toISOString();
//				var subvalid_from = valid_from.substring(0, 11);
				
//				oViewModel.setProperty("/dataValidade", subvalid_from);
				oViewModel.setProperty("/isNew", false);
				oViewModel.setProperty("/identificador", key);
				oViewModel.setProperty("/btProcessarVisible", true);
				oViewModel.setProperty("/btSalvarVisible", false);
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/btCancelarVisible", false);
				oViewModel.setProperty("/formEditable", false);
				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("distribuicaoOData", {
						DISTRIBUTION_ID : key
//						VALID_FROM : data
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));
			}
		},
		// _onObjectMatched : function (oEvent) {
		// var sObjectId = oEvent.getParameter("arguments").objectId;
		// this.getModel().metadataLoaded().then( function() {
		// var sObjectPath = this.getModel().createKey("distribuicaoOData", {
		// DISTRIBUTION_ID : sObjectId
		// });
		// this._bindView("/" + sObjectPath);
		// }.bind(this));
		// },

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
							// metadata is loaded,
							// otherwise there may be two busy indications next
							// to each other on the
							// screen. This happens because route matched
							// handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived : function() {
						oViewModel.setProperty("/busy", false);
						debugger;
					}
				}
			});
		},

		_onBindingChange : function() {
			var oView = this.getView(), oViewModel = this.getModel("objectView"), oElementBinding = oView.getElementBinding();
			var oModel = this.getModel();
			var that = this;
			// No data for the binding
			debugger;
			if (!oElementBinding.getBoundContext()) {
//				this.getRouter().getTargets().display("objectNotFound");
			oViewModel.setProperty("/busy", false);
				return;
			}
			
			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.DISTRIBUTION_ID, sObjectName = oObject.ACTION_NAME;

			// Everything went fine.

			var isNew = oViewModel.getProperty("/isNew");

			if (isNew === false) {
				oViewModel.setProperty("/actionID", oObject.ACTION_ID);
				this.getView().byId("inAcao").destroyTokens();
				var oToken = new sap.m.Token();
				if (oObject.ACTION_ID) {
					oToken.setKey(oObject.ACTION_ID);
					oToken.setText(oObject.ACTION_NAME);
					this.getView().byId("inAcao").addToken(oToken);
				}
				
				this.getView().byId("inEstadoCentro").destroyTokens();
				if (oObject.REGION) {
					var oToken2 = new sap.m.Token();
					oToken2.setKey(oObject.REGION);
					oToken2.setText(oObject.REGION_NAME);
					this.getView().byId("inEstadoCentro").addToken(oToken2);
				}
				
				this.getView().byId("inMunicipio").destroyTokens();
				if (oObject.CITY_CODE) {
					var oToken3 = new sap.m.Token();
					oToken3.setKey(oObject.CITY_CODE);
					oToken3.setText(oObject.CITY_NAME);
					this.getView().byId("inMunicipio").addToken(oToken3);
				}				

				this.getView().byId("inBairro").destroyTokens();
				if (oObject.CITYP_CODE) {
					var oToken4 = new sap.m.Token();
					oToken4.setKey(oObject.CITYP_CODE);
					oToken4.setText(oObject.CITYP_NAME);
					this.getView().byId("inBairro").addToken(oToken4);
				}

				if (oObject.REGION) {
					var where = oObject.REGION;
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					oModel.read("/cidadeOData", {
						filters : filters,
						success : function(oResponseSucess) {
							that.aItemsCidade = [];
							for (var i = 0; i < oResponseSucess.results.length; i++) {
								that.aItemsCidade.push(oResponseSucess.results[i]);

							}
						},
						error : function(oResponseSucess) {

						}
					});
				}
				
				if (oObject.CITY_CODE) {
					var where = oObject.CITY_CODE;
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("CODIGO_CIDADE", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					oModel.read("/bairroOData", {
						filters : filters,
						success : function(oResponseSucess) {
							that.aItemsBairro = [];
							for (var i = 0; i < oResponseSucess.results.length; i++) {
								that.aItemsBairro.push(oResponseSucess.results[i]);

							}
						},
						error : function(oResponseSucess) {

						}
					});
				}				

//				this.byId("inValidoDesde").setValue(oObject.VALID_FROM);
//				this.byId("inValidoAte").setValue(oObject.VALID_UNTIL);	
				
				var sPath = oElementBinding.getBoundContext().getPath(), oResourceBundle = this.getResourceBundle();

				var jsonModel = sap.ui.getCore().getModel("editModel");				
				if (oObject.ACTION_ID !== "") {
					var where = oObject.ACTION_ID;
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("ACTION_ID", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					oModel.read("/percentActionDistributionOData", {
						filters : filters,
						success : function(oResponseSucess) {
							if(oResponseSucess.results.length > 0){
								var qtd;
								var dstr;
								if(oResponseSucess.results[0].QTD){
									qtd = oResponseSucess.results[0].QTD;
								}else{
									qtd = 0;
								}
								
								if(oResponseSucess.results[0].DISTR){
									dstr = oResponseSucess.results[0].DISTR;
								}else{
									dstr = 0;
								}
								var value = qtd + "% - " + dstr;
								that.getView().byId("inDistrib").setValue(value);								
							}

						},
						error : function(oResponseSucess) {

						}
					});
				}
			}						
			
			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [ sObjectName ]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [ sObjectId ]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [ sObjectName, sObjectId, location.href ]));
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
			var oViewModel = this.getModel("objectView");
			debugger;
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/busy", false);
//			var sPreviousHash = History.getInstance().getPreviousHash(), oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			// if (sPreviousHash !== undefined ||
			// !oCrossAppNavigator.isInitialNavigation()) {
			// history.go(-1);
			// } else {
			this.getRouter().navTo("worklist", {}, true);
			// }
		},
		onGravar : function() {

			var oViewModel = this.getModel("objectView");
			var isNew = oViewModel.getProperty("/isNew");
			var oModel = this.getModel();
			var that = this;
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();

			debugger;
			this._validateFields();

			var ok = oViewModel.getProperty("/validar");
			if (ok) {

				if (isNew) {
					debugger;
					oModel.read("/genDistributionID", {
						success : function(oResponseSucess) {
							var oModelObject = {};
							oModelObject.DISTRIBUTION_ID = oResponseSucess.results[0].GEN_DISTRIBUTION_ID;

							that._fillModel(that, oModelObject);
							oModel.create("/distribuicaoOData", oModelObject, {
								async : false,
								success : function(oResponseSucess) {

									debugger;
									oModel.refresh();
									that._clearObject();
									that.onNavBack();

								},
								error : function(oResponseError) {
									debugger;
									sap.m.MessageBox.error(oResponseError.responseText, {
										id : "serviceErrorMessageBox",
										details : "",
										actions : [ sap.m.MessageBox.Action.CLOSE ],
										onClose : function() {
											oModel.refresh();
											that._clearObject();
//											sap.ui.core.BusyIndicator.hide();
											that.onNavBack();
										}.bind(this)
									});									
//									MessageBox.error("Erro ao criar Distribuição");
//									that.onNavBack();

								}
							});

						},
						error : function(oResponseError) {
							debugger;
							sap.m.MessageBox.error(oResponseError.responseText, {
								id : "serviceErrorMessageBox",
								details : "",
								actions : [ sap.m.MessageBox.Action.CLOSE ],
								onClose : function() {
									oModel.refresh();
									that._clearObject();
//									sap.ui.core.BusyIndicator.hide();
									that.onNavBack();
								}.bind(this)
							});								
//							MessageBox.error("Erro ao gerar ID do Distribuição!");
//							that.onNavBack();
						}
					});
				} else {
					var oModelObject = {};
					oModelObject.DISTRIBUTION_ID = oObject.DISTRIBUTION_ID;
					this._fillModel(that, oModelObject);
					debugger;
					var valid_from = oModelObject.VALID_FROM.toISOString();
//					var data = valid_from.substring(0, 11);
//					var data = oViewModel.getProperty("/dataValidade");
//					data = data.substring()
					var data = "2017-06-12T";
					var time = '00:00:00.0000000', valid_from = data + time;
//					oModel.update("/distribuicaoOData(DISTRIBUTION_ID=" + oModelObject.DISTRIBUTION_ID + ",VALID_FROM=datetime'" + valid_from + "')", oModelObject, {
					oModel.update("/distribuicaoOData(DISTRIBUTION_ID=" + oModelObject.DISTRIBUTION_ID + ")", oModelObject, {
					
						merge : false,
						success : function(oData, response) {
							debugger;
//							that._clearObject();
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
									that.onNavBack();
									oViewModel.setProperty("/busy", false);
								}.bind(this)
							});
						}
					});
				}
			}

		},

		onChangeEstado : function(){
			this.getView().byId("inMunicipio").destroyTokens();
			this.getView().byId("inBairro").destroyTokens();
//			var oTokens = this.getView().byId("inEstadoCentro").getTokens();
//			if(oTokens.length === 0){
				this.aItemsCidade = [];
				this.aItemsBairro = [];			
//			}
//			if(this.getView().byId("inMunicipio").getTokens().length === 0){
//				this.aItemsBairro = [];				
//			}			

		},
		
		onChangeCidade : function(){
			this.getView().byId("inBairro").destroyTokens();
			var oTokens = this.getView().byId("inMunicipio").getTokens();
//			if(oTokens.length === 0){
				this.aItemsBairro = [];				
//			}

		},
		
		onChangeAcao : function(){
			this.getView().byId("inDistrib").setValue("");
		},
		
		/* =========================================================== */
		/* internal methods */
		/* =========================================================== */

		_clearObject : function() {
			this.getView().byId("comboEmpresa").setSelectedKey("");
			this.getView().byId("inDistrib").setValue("");
			this.getView().byId("inPercentual").setValue("");
			this.getView().byId("inValidoDesde").setValue("");
			this.getView().byId("inValidoAte").setValue("");
			this.getView().byId("inAcao").destroyTokens();
			this.getView().byId("inEstadoCentro").destroyTokens();
			this.getView().byId("inMunicipio").destroyTokens();
			this.getView().byId("inBairro").destroyTokens();
		},

		_fillModel : function(that, oModelObject) {
			debugger;  
			var oViewModel = this.getModel("objectView");
			var tokens;

			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern : "dd/MM/yyyy"
			});
			debugger;
			if (this.byId("inValidoDesde").getValue()) {
				var strDataDesde = dateFormat.parse(this.byId("inValidoDesde").getValue());
				oModelObject.VALID_FROM = new Date(strDataDesde);

			} else {
				oModelObject.VALID_FROM = new Date();
			}

			if (this.byId("inValidoAte").getValue()) {
				var strDataAte = dateFormat.parse(this.byId("inValidoAte").getValue());
				oModelObject.VALID_UNTIL = new Date(strDataAte);
			} else {
				oModelObject.VALID_UNTIL = new Date();
			}
			tokens = that.byId("inAcao").getTokens();
			if (tokens.length > 0) {
				oModelObject.ACTION_ID = tokens[0].getKey();
				oModelObject.ACTION_NAME = tokens[0].getText();
			}

			oModelObject.BUKRS = this.byId("comboEmpresa").getSelectedKey();
			// oModelObject.BUTXT = "";

			oModelObject.PERCENTUAL_DISTRIBUICAO = that.byId("inPercentual").getValue();
			oModelObject.USR01_BNAME = 'CT16030';
			oModelObject.COUNTRY = 'BR';

			tokens = that.byId("inEstadoCentro").getTokens();
			if (tokens.length > 0) {
				oModelObject.REGION = tokens[0].getKey();
				oModelObject.REGION_NAME = tokens[0].getText().substring(0,20);
				
			}else{
				oModelObject.REGION = "";
				oModelObject.REGION_NAME = "";	

			}

			tokens = that.byId("inMunicipio").getTokens();
			if (tokens.length > 0) {
				oModelObject.CITY_CODE = tokens[0].getKey();
				oModelObject.CITY_NAME = tokens[0].getText().substring(0,40);
			}else{
				oModelObject.CITY_CODE = "";
				oModelObject.CITY_NAME = "";	
			}

			tokens = that.byId("inBairro").getTokens();
			if (tokens.length > 0) {
				oModelObject.CITYP_CODE = tokens[0].getKey();
				oModelObject.CITYP_NAME = tokens[0].getText().substring(0,40);
			}
			oModelObject.QTD_DISTRIBUICAO = "0.00";
		},

		_validateFields : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/validar", true);
			var oTokens;

			var empresa = this.getView().byId("comboEmpresa").getSelectedKey();
			if (empresa === "") {
				var msg3 = this.getView().getModel("i18n").getResourceBundle().getText("msgErroEmpresa");
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(msg3, {
					of : this.getView().byId("comboEmpresa")
				});
				oViewModel.setProperty("/validar", false);
				return;
			}

			oTokens = this.getView().byId("inAcao").getTokens();
			if (oTokens.length === 0) {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgErroAcao"), {
					of : this.getView().byId("inAcao")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}
//			oTokens = this.getView().byId("inEstadoCentro").getTokens();
//			if (oTokens.length === 0) {
//				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgErroEstado"), {
//					of : this.getView().byId("inEstadoCentro")
//				});
//				oViewModel.setProperty("/validar", false);
//				return;
//
//			}
//			oTokens = this.getView().byId("inMunicipio").getTokens();
//			if (oTokens.length === 0) {
//				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgErroMunicipio"), {
//					of : this.getView().byId("inMunicipio")
//				});
//				oViewModel.setProperty("/validar", false);
//				return;
//
//			}

			if (this.byId("inPercentual").getValue() === "") {
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgErroPercentual"), {
					of : this.getView().byId("inPercentual")
				});
				oViewModel.setProperty("/validar", false);
				return;
			}
		},
		

		onProcessar : function() {
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", true);
			oViewModel.setProperty("/btApagarVisible", true);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/formEditable", true);
			oViewModel.setProperty("/isNew", false);
			// oViewModel.setProperty("/viewTitle",
			// this.getView().getModel("i18n").getResourceBundle().getText("changeViewTitle"));
		},

		onCancelar : function() {
			debugger;
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", true);
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/isNew", false);			
			oViewModel.setProperty("/buttonVisible", false);
			// oViewModel.setProperty("/viewTitle",
			// this.getView().getModel("i18n").getResourceBundle().getText("editViewTitle"));
			this.getView().unbindElement();
			this.onNavBack();
			// this._bindView(sPath);

		},

		onDeletar : function() {
			var oComponent = this.getOwnerComponent(), oModel = this.getModel();
			var that = this;
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			var sObjectId = oObject.DISTRIBUTION_ID;
			var oViewModel = this.getModel("objectView");
			var action_id = sObjectId;
//			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
//				pattern : "dd/MM/yyyy"
//			});

//			var strDataDesde = dateFormat.parse(this.byId("inValidoDesde").getValue());
//			var strDataDesde = oViewModel.getProperty("/dataValidade");
//			var date = new Date(strDataDesde);
//			var valid_from = date.toISOString();
//			var subvalid_from = valid_from.substring(0, 11);
//			var horas = "00:00:00.0000000";
//			valid_from = subvalid_from + horas;

			sap.m.MessageBox.confirm("Deseja ENCERRAR a Distribuição selecionada?", {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// Apaga o registro
						var jsonModel = sap.ui.getCore().getModel("editModel");
//						var sPath = "/distribuicaoOData(DISTRIBUTION_ID=" + sObjectId + ",VALID_FROM=datetime'" + valid_from + "')";
						var sPath = "/distribuicaoOData(DISTRIBUTION_ID=" + sObjectId + ")";
						debugger;
						oModel.remove(sPath);

						// Volta para a tela inicial
						that.onNavToWorklist();
					}
				}
			});

		},
		openCompany : function(){
			this.getView().byId("inAcao").destroyTokens();
			this.aItemsAcao = [];
			this.getView().byId("inEstadoCentro").destroyTokens();	
			this.getView().byId("inMunicipio").destroyTokens();
			this.getView().byId("inBairro").destroyTokens();
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

		onEstadoHelp : function() {
			// This code was generated by the layout editor.
			var that = this;
			var oModel = this.getModel();
			var oInput = this.getView().byId("inEstadoCentro");
			var oViewModel = this.getModel("objectView");
			var oKeyEmpresa = this.getView().byId("comboEmpresa").getSelectedKey();			
			var oInputEmpresa = this.getView().byId("comboEmpresa").getValue();
			if (oInputEmpresa === "") {
				sap.m.MessageToast.show("Preencher primeiro a empresa", {
					of : this.getView().byId("inEstadoCentro")
				});
				return;
			}				
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idEstadoHelpFragment", {
				supportMultiselect : false,
				filterMode : true,
				title : "Estado",
				key : "CODIGO_UF",
				descriptionKey : "UF",
				ok : function(oEventCanal) {
					var aTokens = oEventCanal.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						// oViewModel.setProperty("/estadoID", token.getKey());
						var key = token.getKey();
					}
					debugger;
					if (key) {
						var where = key;
						var filters = new Array();
						var filterByID = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, where);
						filters.push(filterByID);
						debugger;
						
						filterByID = new sap.ui.model.Filter("BUKRS", sap.ui.model.FilterOperator.EQ, oKeyEmpresa);
						filters.push(filterByID);
						oModel.read("/cidadeConcessaoOData", {
							filters : filters,
							success : function(oResponseSucess) {
								that.aItemsCidade = [];
								for (var i = 0; i < oResponseSucess.results.length; i++) {
									that.aItemsCidade.push(oResponseSucess.results[i]);

								}
							},
							error : function(oResponseSucess) {

							}
						});
					}

					oValueHelp.close();
					var oInputCidade = that.getView().byId("inMunicipio");
					oInputCidade.destroyTokens();
					var oInputBairro = that.getView().byId("inBairro");
					oInputBairro.destroyTokens();
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
					label : "Código",
					template : "CODIGO_UF"
				}, {
					label : "UF",
					template : "UF"
				} ]
			});
			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");
			oTable.setModel(this.getModel());
			var where = this.byId("comboEmpresa").getSelectedKey();
			var filterByID = new sap.ui.model.Filter("BUKRS", sap.ui.model.FilterOperator.EQ, where);
			var filters = new Array();
			filters.push(filterByID);			
			
			oModel.read("/ufConcessaoOData", {
				 filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];				
					debugger;
					var sTable = [];
					var esquema;
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var sort = {};
						sort.CODIGO_UF = oResponseSucess.results[i].CODIGO_UF;
						sort.UF = oResponseSucess.results[i].UF;

						sTable.push(sort);
					}
//					var newArray = that.removeDuplicates(sTable, "SCHEMA_NAME");
					
					var sortedTable = sTable.sort(function(a, b) {
						var nameA = a.CODIGO_UF.toLowerCase(), nameB = b.CODIGO_UF.toLowerCase();
						if (nameA < nameB) // sort string ascending
							return -1;
						if (nameA > nameB)
							return 1;
						return 0; // default return value (no sorting)
					});

					var oTable = oValueHelp.getTable();
					oTable.setModel(oColModel, "columns");

					var oRowsModel = new sap.ui.model.json.JSONModel();
					oRowsModel.setData(sortedTable);
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
//			oTable.bindRows("/ufOData");
//			oValueHelp.open();
//			oValueHelp.update();
		},

		onCityHelp : function() {
			debugger;
			// This code was generated by the layout editor.
			var that = this;
			var oInput = this.getView().byId("inMunicipio");
			var oModel = this.getModel();
			var oView = this.getView();
			var oViewModel = this.getModel("objectView");

			var oInputCity = this.getView().byId("inEstadoCentro").getTokens();
			if (oInputCity.length === 0) {
				sap.m.MessageToast.show("Preencher primeiro o Estado", {
					of : this.getView().byId("inEstadoCentro")
				});
				return;
			}
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idCityHelp", {
				basicSearchText : oInput.getValue(),
				supportMultiselect : false,
				filterMode : true,
				title : "Cidade",
				key : "CODIGO_CIDADE",
				descriptionKey : "CIDADE",
				ok : function(oEventCanal) {
					var aTokens = oEventCanal.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						var key = token.getKey();

						if (key) {
							var where = key;
							var filters = new Array();
							var filterByID = new sap.ui.model.Filter("CODIGO_CIDADE", sap.ui.model.FilterOperator.EQ, where);
							filters.push(filterByID);
							oModel.read("/bairroOData", {
								filters : filters,
								success : function(oResponseSucess) {
									that.aItemsBairro = [];
									for (var i = 0; i < oResponseSucess.results.length; i++) {
										that.aItemsBairro.push(oResponseSucess.results[i]);

									}
								},
								error : function(oResponseSucess) {

								}
							});
						}

					}
					oValueHelp.close();
					var oInputBairro = that.getView().byId("inBairro");
					oInputBairro.destroyTokens();
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
					label : "Código",
					template : "CODIGO_CIDADE"
				}, {
					label : "Cidade",
					template : "CIDADE"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			var oRowsModel = new sap.ui.model.json.JSONModel();
			debugger;
			if (that.aItemsCidade.length === 0) {
				var oTokenRegion = oView.byId("inEstadoCentro").getTokens();
				for (var i = 0; i < oTokenRegion.length; i++) {
					var token = oTokenRegion[i];
					
					var where = token.getKey();
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					
					where = this.byId("comboEmpresa").getSelectedKey();
					filterByID = new sap.ui.model.Filter("BUKRS", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					
					oModel.read("/cidadeConcessaoOData", {
						filters : filters,					
//					oModel.read("/cidadeOData", {
//						filters : filters,
						success : function(oResponseSucess) {
							for (var i = 0; i < oResponseSucess.results.length; i++) {
								that.aItemsCidade.push(oResponseSucess.results[i]);

							}

							oRowsModel.setData(that.aItemsCidade);
							oTable.setModel(oRowsModel);
							if (oTable.bindRows) {
								oTable.bindRows("/");
							}
						},
						error : function(oResponseSucess) {

						}
					});

				}
			}

			oRowsModel.setData(that.aItemsCidade);
			oTable.setModel(oRowsModel);
			if (oTable.bindRows) {
				oTable.bindRows("/");
			}

			oValueHelp.addStyleClass("sapUiSizeCozy");
			oValueHelp.open();
			oValueHelp.update();
		},

		onBairroHelp : function() {
			debugger;
			// This code was generated by the layout editor.
			var that = this;
			var oInput = this.getView().byId("inBairro");
			var oViewModel = this.getModel("objectView");
			var oModel = this.getModel();
			var oInputCity = this.getView().byId("inMunicipio").getTokens();
			if (oInputCity.length === 0) {
				sap.m.MessageToast.show("Preencher o município primeiro", {
					of : this.getView().byId("inMunicipio")
				});
				return;
			}
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idBairroHelp", {
				basicSearchText : oInput.getValue(),
				supportMultiselect : false,
				filterMode : true,
				title : "Bairro",
				key : "CODIGO_BAIRRO",
				descriptionKey : "BAIRRO",
				ok : function(oEventCanal) {
					var aTokens = oEventCanal.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						// oInput.setValue(token.getText());
						// oViewModel.setProperty("/channelId", token.getKey());
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
					label : "Código",
					template : "CODIGO_BAIRRO"
				}, {
					label : "Bairro",
					template : "BAIRRO"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			var oRowsModel = new sap.ui.model.json.JSONModel();

			if (that.aItemsBairro.length === 0) {
				var oTokenCity = this.getView().byId("inMunicipio").getTokens();
				for (var i = 0; i < oTokenCity.length; i++) {
					var token = oTokenCity[i];
					var where = token.getKey();
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("CODIGO_CIDADE", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					oModel.read("/bairroOData", {
						filters : filters,
						success : function(oResponseSucess) {
							for (var i = 0; i < oResponseSucess.results.length; i++) {
								that.aItemsBairro.push(oResponseSucess.results[i]);

							}

							oRowsModel.setData(that.aItemsBairro);
							oTable.setModel(oRowsModel);
							if (oTable.bindRows) {
								oTable.bindRows("/");
							}
						},
						error : function(oResponseSucess) {

						}
					});

				}
			}

			oRowsModel.setData(that.aItemsBairro);
			oTable.setModel(oRowsModel);
			if (oTable.bindRows) {
				oTable.bindRows("/");
			}

			oValueHelp.addStyleClass("sapUiSizeCozy");
			oValueHelp.open();
			oValueHelp.update();
		},
		onAcaoHelp : function() {
			// This code was generated by the layout editor.

			var oInput = this.getView().byId("inAcao");
			var oViewModel = this.getModel("objectView");
			var oModel = this.getModel();
			var that = this;
			var key;
			debugger;
			var oInputEmpresa = this.getView().byId("comboEmpresa").getValue();
			if (oInputEmpresa === "") {
				sap.m.MessageToast.show("Preencher primeiro a empresa", {
					of : this.getView().byId("inAcao")
				});
				return;
			}			
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAcaoHelp", {
				supportMultiselect : false,
				title : "Ação",
				key : "ACTION_ID",
				descriptionKey : "NAME",
				ok : function(oEventTipo) {
					var aTokens = oEventTipo.getParameter("tokens");
					debugger;
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						oViewModel.setProperty("/actionID", token.getKey());
						key = token.getKey();
						that.getView().byId("inDistrib").setValue("");
					}
					debugger;
					if (key) {
						var where = key;
						var filters = new Array();
						var filterByID = new sap.ui.model.Filter("ACTION_ID", sap.ui.model.FilterOperator.EQ, where);
						filters.push(filterByID);
						oModel.read("/percentActionDistributionOData", {
							filters : filters,
							success : function(oResponseSucess) {
								if(oResponseSucess.results.length > 0){	
									debugger;
									var distr = 0;
									var qtd = 0;
									if(oResponseSucess.results[0].DISTR){
										distr = oResponseSucess.results[0].DISTR; 
									}
									
									if(oResponseSucess.results[0].QTD){
										qtd = oResponseSucess.results[0].QTD; 
									}									
									
									var value = qtd + "% - " + distr;
									that.getView().byId("inDistrib").setValue(value);								
								}
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
					label : "Código",
					template : "ACTION_ID"
				}, {
					label : "Ação",
					template : "NAME"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");
			
//			oTable.setModel(this.getModel());
//			oTable.bindRows("/acaoOData");
			
			var oRowsModel = new sap.ui.model.json.JSONModel();

			if (that.aItemsAcao.length === 0) {
					var where = this.byId("comboEmpresa").getSelectedKey();
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("BUKRS", sap.ui.model.FilterOperator.EQ, where);
					var filterByIF = new sap.ui.model.Filter("IF_CAMP_SERVICE", sap.ui.model.FilterOperator.EQ, 0);
					filters.push(filterByID);
					filters.push(filterByIF);
					oModel.read("/acaoOData", {
						filters : filters,
						success : function(oResponseSucess) {
							for (var i = 0; i < oResponseSucess.results.length; i++) {
								that.aItemsAcao.push(oResponseSucess.results[i]);

							}

							oRowsModel.setData(that.aItemsAcao);
							oTable.setModel(oRowsModel);
							if (oTable.bindRows) {
								oTable.bindRows("/");
							}
						},
						error : function(oResponseSucess) {

						}
					});


			}

			oRowsModel.setData(that.aItemsAcao);
			oTable.setModel(oRowsModel);
			if (oTable.bindRows) {
				oTable.bindRows("/");
			}			
			
			oValueHelp.open();
			oValueHelp.update();

		}
		

	});

});