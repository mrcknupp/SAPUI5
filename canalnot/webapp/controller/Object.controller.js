/*global location*/
sap.ui.define([ "com/cpfl/canalnot/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/canalnot/model/formatter" ], function(BaseController, JSONModel, History, formatter) {
	"use strict";
	return BaseController.extend("com.cpfl.canalnot.controller.Object", {
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
			this._oResourceBundle = this.getResourceBundle();
			// Model used to manipulate control states. The chosen values make
			// sure,
			// detail page is busy indication immediately so there is no break
			// in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				boxCCS : true,
				boxLayout : false,
				tipoInterfaceSelectedKey : 0,
				btProcessarVisible : true,
				btSalvarVisible : false,
				btApagarVisible : false,
				btCancelarVisible : false,
				checkServico : false,
				inTpLayout : false,
				formEditable : false,
				isNew : false,
				channelID : 0,
				layoutID : 0,
				activID : 0,
				saldoMesBase : 0,
				saldoAnoBase : 0,
				valid_from : null,
				validar : true,
				tipoQtdKey : 0,
				inQtdAnual : false,
				inFatura : false
			});
			this.aItemsCentro = [];
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
		_processObject : function(objectId) {

			this.getRouter().navTo("objectCreate", {
				objectId : objectId
			});
		},
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
			// this._clearFields();
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/checkServico", false);
			// var sPreviousHash = History.getInstance().getPreviousHash(),
			// oCrossAppNavigator =
			// sap.ushell.Container.getService("CrossApplicationNavigation");
			// if (sPreviousHash !== undefined ||
			// !oCrossAppNavigator.isInitialNavigation())
			// {
			// history.go(-1);
			// } else {

			this.getRouter().navTo("worklist", {}, true);
			// }
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
			var oViewModel = this.getModel("objectView");
			var oView = this.getView();

			if (sObjectId === "Novo") {
				this._clearFields();
				var oView = this.getView();
				this.onProcessar();
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/isNew", true);
				oView.byId("rbCCS").setSelected(true);

				var bindingContext = oView.getBindingContext();
				if (bindingContext) {
					this.getView().unbindElement();
				}
				this.getModel().metadataLoaded().then(function() {
					var oEntry = oView.getModel().createEntry("canalNotificacaoOData");
					oView.setBindingContext(oEntry);
					// Campos Interface
					this.byId("rbCCS").setSelected(true);
					oViewModel.setProperty("/boxCCS", true);
					oViewModel.setProperty("/boxLayout", false);
				}.bind(this));
				oViewModel.setProperty("/busy", false);
			} else {
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/isNew", false);
				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("canalNotificacaoOData", {
						CHANNEL_ID : sObjectId
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
					}
				}
			});
		},
		_onBindingChange : function() {

			var oView = this.getView(), oModel = this.getModel(), oViewModel = this.getModel("objectView"), oElementBinding = oView.getElementBinding(), that = this;
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.CHANNEL_ID, sObjectName = oObject.DESCRIPTION;
			// Everything went fine.

			var isNew = oViewModel.getProperty("/isNew");

			if (isNew === false) {
				oViewModel.setProperty("/channelID", oObject.CHANNEL_ID);
				oViewModel.setProperty("/layoutID", oObject.LAYOUT_ID);
				oViewModel.setProperty("/activtID", oObject.CAMP_ACTIVITY_ID);
				this.getView().byId("inTpLayout").destroyTokens();
				var oToken = new sap.m.Token();
				if (oObject.LAYOUT_ID) {
					oToken.setKey(oObject.LAYOUT_ID);
					oToken.setText(oObject.LAYOUT_NAME);
					this.getView().byId("inTpLayout").addToken(oToken);
				}
				
				this.getView().byId("inCCS").destroyTokens();
				var oToken = new sap.m.Token();
				if (oObject.INTEGRATION_CCS) {
//					oToken.setKey(oObject.LAYOUT_ID);
					oToken.setText(oObject.INTEGRATION_CCS);
					this.getView().byId("inCCS").addToken(oToken);
				}				
				
				this.getView().byId("inTpServico").destroyTokens();
				if (oObject.CAMP_ACTIVITY_ID) {
					var oToken2 = new sap.m.Token();
					oToken2.setKey(oObject.CAMP_ACTIVITY_ID);
					oToken2.setText(oObject.CAMP_ACTIVITY);
					this.getView().byId("inTpServico").addToken(oToken2);
				}

				if (oObject.CAMP_ACTIVITY_ID) {
					var where = oObject.CAMP_ACTIVITY_ID;
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("CAMP_ACTIVITY_ID", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					oModel.read("/equipeTipoServicoOData", {
						filters : filters,
						success : function(oResponseSucess) {
							that.aItemsCentro = [];
							for (var i = 0; i < oResponseSucess.results.length; i++) {
								that.aItemsCentro.push(oResponseSucess.results[i]);

							}
						},
						error : function(oResponseSucess) {

						}
					});
				}
				var sPath = oElementBinding.getBoundContext().getPath(), oResourceBundle = this.getResourceBundle();

				// that.getView().byId('inAtributo').destroyTokens();

				oModel.read(sPath + "/servicoCampoCanal", {
					success : function(oResponseSucess) {
						that.getView().byId('inCentro').destroyTokens();
						var data;
						if (oResponseSucess.results[0].VALID_FROM) {
							data = oResponseSucess.results[0].VALID_FROM;
						} else {
							data = new Date();
						}

						oViewModel.setProperty("/valid_from", data);
						for (var i = 0; i < oResponseSucess.results.length; i++) {
							var oToken = new sap.m.Token();
							oToken.setKey(oResponseSucess.results[i].SERVICE_TEAM_ID);
							oToken.setText(oResponseSucess.results[i].NAME);
							that.getView().byId('inCentro').addToken(oToken);
						}
					}
				});
			}

			// Campos Interface
			if (oObject.INTEGRATION_CCS) {
				oView.byId("rbCCS").setSelected(true);
				oViewModel.setProperty("/boxCCS", true);
				oViewModel.setProperty("/boxLayout", false);
			} else {
				oView.byId("rbLayout").setSelected(true);
				oViewModel.setProperty("/boxCCS", false);
				oViewModel.setProperty("/boxLayout", true);
			}
			// Campo Forma de Envio
			var lFormaEnvio = oObject.BUDGET_METHOD_SENDER;
			if (lFormaEnvio === 1) {
				oView.byId("rbContaContrato").setSelected(true);
				oViewModel.setProperty("/inFatura", false);
			} else {
				oView.byId("rbQtdFatura").setSelected(true);
				oViewModel.setProperty("/inFatura", true);
			}
			// Campo Serviço de Campo
			var lServicoCampo = oObject.IF_CAMP_SERVICE;
			if (lServicoCampo === 1) {
				oView.byId("cbServico").setSelected(true);
			}

			// Campo Contagem
			var lContagem = oObject.BUDGET_METHOD_COUNT;

			switch (lContagem) {
			case 1:
				oView.byId("rbEnvio").setSelected(true);
				break;
			case 2:
				oView.byId("rbConfirmacao").setSelected(true);
				break;
			case 3:
				oView.byId("rbPagamento").setSelected(true);
				break;
			default:
				oView.byId("rbEnvio").setSelected(true);
				break;

			}
			// Campo Quantidades
			// var lQtdMensal = oObject.BUDGET_PROVIDE_MONTH;
			// var lQtdAnual = oObject.BUDGET_PROVIDE_YEAR;
			//
			// if (lQtdMensal) {
			// oView.byId("inQtdMensal").setValue(lQtdMensal);
			// oView.byId("rbQtdMes").setSelected(true);
			// oViewModel.setProperty("/inQtdMensal", true);
			// oViewModel.setProperty("/inQtdAnual", false);
			// } else if (lQtdAnual) {
			// oView.byId("inQtdAnual").setValue(lQtdMensal);
			// oView.byId("rbQtdAno").setSelected(true);
			// oViewModel.setProperty("/inQtdAnual", true);
			// oViewModel.setProperty("/inQtdMensal", false);
			// }

			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [ sObjectName ]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [ sObjectId ]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [ sObjectName, sObjectId, location.href ]));
		},
		onSelectTipoQuantidade : function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var teste = oEvent.getParameter("selectedIndex");
			switch (teste) {
			case 0:
				oViewModel.setProperty("/inQtdMensal", true);
				oViewModel.setProperty("/inQtdAnual", false);
				break;
			case 1:
				oViewModel.setProperty("/inQtdMensal", false);
				oViewModel.setProperty("/inQtdAnual", true);
				break;
			}
		},
		onSelectFormaEnvio : function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var teste = oEvent.getParameter("selectedIndex");
			switch (teste) {
			case 0:
				oViewModel.setProperty("/inContaContrato", true);
				oViewModel.setProperty("/inFatura", false);
				break;
			case 1:
				oViewModel.setProperty("/inContaContrato", false);
				oViewModel.setProperty("/inFatura", true);
				break;
			}
		},
		onSelectTipoInterface : function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var teste = oEvent.getParameter("selectedIndex");
			switch (teste) {
			case 0:
				oViewModel.setProperty("/boxCCS", true);
				oViewModel.setProperty("/boxLayout", false);
				break;
			case 1:
				oViewModel.setProperty("/boxCCS", false);
				oViewModel.setProperty("/boxLayout", true);
				break;
			}
		},
		/**
		 * @memberOf com.cpfl.canalnot.controller.Object
		 */
		_onClearProperties : function() {
			var oViewModel = this.getModel("objectView");

			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/checkServico", false);
			oViewModel.setProperty("/inTpLayout", false);
			oViewModel.setProperty("/channelID", 0);
			oViewModel.setProperty("/layoutID", 0);
			oViewModel.setProperty("/activID", 0);
			oViewModel.setProperty("/valid_from", null);
			oViewModel.setProperty("/validar", true);
			oViewModel.setProperty("/tipoQtdKey", 0);
			oViewModel.setProperty("/inQtdAnual", false);
			oViewModel.setProperty("/inFatura", false);

			// Reseta o model para o inicial
			// var isNew = oViewModel.getProperty("/isNew");
			// if (isNew) {
			oViewModel.setProperty("/isNew", false);
			// }
		},
		onCancelar : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", true);
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("/checkServico", false);
			oViewModel.setProperty("/inTpLayout", false);
			oViewModel.setProperty("/channelID", 0);
			oViewModel.setProperty("/layoutID", 0);
			oViewModel.setProperty("/activID", 0);
			oViewModel.setProperty("/valid_from", null);
			oViewModel.setProperty("/validar", true);
			oViewModel.setProperty("/tipoQtdKey", 0);
			oViewModel.setProperty("/inQtdAnual", false);
			oViewModel.setProperty("/inFatura", false);

			// Reseta o model para o inicial
			var isNew = oViewModel.getProperty("/isNew");
			if (isNew) {
				oViewModel.setProperty("/isNew", false);
				this.onNavBack();
			} else {
				var oView = this.getView();
				var oElementBinding = oView.getElementBinding();
				var sPath = oElementBinding.sPath;
				this.getView().unbindElement();
				this._bindView(sPath);
				this.onNavBack();
			}

		},
		/**
		 * @memberOf com.cpfl.canalnot.controller.Object
		 */
		onDeletar : function() {
			// Apaga o registro
			var oView = this.getView();
			var elm = oView.getElementBinding();
			var oModel = elm.getModel();
			var that = this;
			var oComponent = this.getOwnerComponent();

			sap.m.MessageBox.confirm("Confirma APAGAR o Canal selecionado?", {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// Apaga o registro
						var jsonModel = sap.ui.getCore().getModel("editModel");
						oModel.remove(oView.getBindingContext().getPath());

						// Volta para a tela inicial
						that.onNavBack();
					}
				}
			});
		},

		/**
		 * @memberOf com.cpfl.canalnot.controller.Object
		 */
		onGravar : function() {
			// Salva o registro
			var that = this, oModel = this.getModel();
			var oView = this.getView();
			var oViewModel = this.getModel("objectView");
			var oObject = oView.getBindingContext().getObject();
			var isNew = oViewModel.getProperty("/isNew");
			var valid_from = oViewModel.getProperty("/valid_from");

			this._validateFields();

			var ok = oViewModel.getProperty("/validar");
			if (ok) {
				if (isNew) {

					oModel.read("/genChannelID", {
						success : function(oResponseSucess) {
							var oModelObject = {};

							oModelObject.CHANNEL_ID = oResponseSucess.results[0].GEN_CHANNEL_ID;
							that.fillModel(that, oModelObject);
							oModel.create("/canalNotificacaoOData", oModelObject, {
								async : false,
								success : function(oData, response) {

									if (oModelObject.IF_CAMP_SERVICE === 1) {

										var dataFrom = new Date();
										var dataUntil = new Date();

										var oTokens = that.getView().byId('inCentro').getTokens();
										for (var i = 0; i < oTokens.length; i++) {
											var token = oTokens[i];
											var oFields = {};
											oFields.CHANNEL_ID = oModelObject.CHANNEL_ID;
											oFields.SERVICE_TEAM_ID = token.getKey();
											oFields.VALID_FROM = dataFrom;
											oFields.VALID_UNTIL = dataUntil;
											oFields.NAME = token.getText();
											oModel.create("/servicoCampoCanalOData", oFields, {
												async : true,
												success : function(oResponseSuccess) {
													// sap.ui.commons.MessageBox.alert("Sucesso
													// Serviço");
													oModel.refresh();
													that._onClearProperties;
													that.getView().byId("inTpLayout").destroyTokens();
													that.getView().byId("inCSS").destroyTokens();
													that.getView().byId("inTpServico").destroyTokens();
													that.onNavBack();

												},
												error : function(oResponseError) {
													// sap.ui.commons.MessageBox.alert("Erro
													// Serviço");
												}
											});
										}
									} else {
										oModel.refresh();
										that.onNavBack();
									}
								},
								error : function(oResponse) {
									this.onNavBack();
								}
							});

						},
						error : function(oResponseSucess) {

							sap.ui.commons.MessageBox.alert("Erro ao gerar ID");
							this.onNavBack();
						}
					});

				} else {
					var oModelObject = that.getView().getBindingContext().getObject();
					var oModelUpdate = {};

					oModelUpdate.CHANNEL_ID = oModelObject.CHANNEL_ID;
					that.fillModel(that, oModelUpdate);

					oModelUpdate.CHANNEL_TEAM = [];
					debugger;
					if (that.byId("cbServico").getSelected()) {
						var oTokens = that.getView().byId('inCentro').getTokens();
						if (oTokens.length > 0) {
							for (var i = 0; i < oTokens.length; i++) {
								var token = oTokens[i];
								var oModelChannelFields = {};
								oModelChannelFields.SERVICE_TEAM_ID = token.getKey();
								if (valid_from) {
									oModelChannelFields.VALID_FROM = valid_from;
								} else {
									oModelChannelFields.VALID_FROM = new Date();
								}

								oModelChannelFields.VALID_UNTIL = new Date();
								oModelUpdate.CHANNEL_TEAM.push(oModelChannelFields);
							}
						} else {
							oModelUpdate.CAMP_ACTIVITY_ID = null;
						}

					} else {
						oModelUpdate.CAMP_ACTIVITY_ID = null;
					}

					jQuery.ajax({
						url : "/accs/services/updateCanalNotificacao.xsjs",
						method : 'PUT',
						data : JSON.stringify(oModelUpdate),
						contentType : 'application/json; charset=utf-8',

						success : function(oData, response) {

							that.getView().byId("inTpLayout").destroyTokens();
							that.getView().byId("inCCS").destroyTokens();
							that.getView().byId("inTpServico").destroyTokens();
							oModel.refresh();
							that._onClearProperties();
							that.onNavBack();
						},
						error : function(oResponseError) {
							var xmlDoc = jQuery.parseXML(oResponseError.responseText);
							var txtErro = xmlDoc.getElementsByTagName("DETAIL")[0].childNodes[0];

							MessageBox.error(txtErro.data, {
								id : "serviceErrorMessageBox",
								details : xmlDoc.getElementsByTagName("message")[0].childNodes[0].data + "\n ########## model\n" + JSON.stringify(model) + "\n ########## modelCnae\n" + JSON.stringify(modelCnae) + "\n ########## modelIndividual\n" + JSON.stringify(modelIndividual)
										+ "\n ########## modelLocal \n" + JSON.stringify(modelLocal),
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
		 * @memberOf com.cpfl.canalnot.controller.Object
		 */

		_clearFields : function() {
			var oView = this.getView();
			var oViewModel = this.getModel();

			// Aba interfaces
			oView.byId("inName").setValue("");
			oView.byId("inDescr").setValue("");

			// Aba interfaces
			oView.byId("rbCCS").setSelected(false);
//			oView.byId("inCCS").setValue("");
			oView.byId("inCCS").destroyTokens();
			oViewModel.setProperty("/layoutID", 0);
			// oView.byId("inTpLayout").setValue("");
			oView.byId("inTpLayout").destroyTokens();

			oView.byId("inEmpresa").setValue("");
			oView.byId("inModelo").setValue("");

			// Aba Serviço de Campo
			oView.byId("cbServico").setSelected(false);
			oViewModel.setProperty("/activID", 0);
			// oView.byId("inTpServico").setValue("");
			oView.byId("inTpServico").destroyTokens();
			oView.byId("inCentro").destroyTokens();

			// Aba Orçamento
			oView.byId("inCustoUnitario").setValue("");
			// oView.byId("rbQtdMes").setSelected(true);
			oView.byId("inQtdMensal").setValue("");
			oView.byId("inQtdAnual").setValue("");

			oView.byId("rbContaContrato").getSelected();
			oView.byId("inFatura").setValue("");

			oView.byId("rbEnvio").setSelected(true);

		},

		_validateFields : function() {''
			// Aba interfaces
			var oViewModel = this.getModel("objectView");
			var oTokens;
			oViewModel.setProperty("/validar", true);

			if (this.byId("inName").getValue() === "") {
				sap.m.MessageToast.show("Preencher Nome", {
					of : this.getView().byId("inName")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			if (this.byId("rbCCS").getSelected()) {
//				if (this.byId("inCCS").getValue() === "") {
				oTokens = this.getView().byId("inCCS").getTokens();
				if (oTokens.length === 0) {				
					sap.m.MessageToast.show("Preencher Interface CCS", {
						of : this.getView().byId("inCCS")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}
			} else {
				oTokens = this.getView().byId("inTpLayout").getTokens();
				if (oTokens.length === 0) {
					sap.m.MessageToast.show("Preencher Tipo de Layout", {
						of : this.getView().byId("inTpLayout")
					});
					oViewModel.setProperty("/validar", false);
					return;

				}
				// if (this.byId("inTpLayout").getValue() === "") {
				// sap.m.MessageToast.show("Preencher Tipo de Layout", {
				// of : this.getView().byId("inTpLayout")
				// });
				// oViewModel.setProperty("/validar", false);
				// return;
				// }
			}

			// Aba Serviço de Campo
			if (this.byId("cbServico").getSelected()) {
				oTokens = this.getView().byId("inTpServico").getTokens();
				if (oTokens.length === 0) {
					sap.m.MessageToast.show("Preencher Serviço de Campo", {
						of : this.getView().byId("inTpServico")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}
				debugger;
				oTokens = this.getView().byId("inCentro").getTokens();
				if (oTokens.length === 0) {
					sap.m.MessageToast.show("Preencher Centro", {
						of : this.getView().byId("inCentro")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}

				// if (this.byId("inTpServico").getValue() === "") {
				// sap.m.MessageToast.show("Preencher Serviço de Campo", {
				// of : this.getView().byId("inTpServico")
				// });
				// oViewModel.setProperty("/validar", false);
				// return;
				// }
			} else {

				if (this.byId("inCustoUnitario").getValue() === "") {
					sap.m.MessageToast.show("Preencher Custo Unitário", {
						of : this.getView().byId("inCustoUnitario")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}

				// if (this.byId("rbQtdMes").getSelected()) {
				if (this.byId("inQtdMensal").getValue() === "") {
					sap.m.MessageToast.show("Preencher Quantidade Mensal", {
						of : this.getView().byId("inQtdMensal")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}
				//
				// } else {
				if (this.byId("inQtdAnual").getValue() === "") {
					sap.m.MessageToast.show("Preencher Quantidade Anual", {
						of : this.getView().byId("inQtdAnual")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}
				// }

				if (!this.byId("rbContaContrato").getSelected()) {
					if (this.byId("inFatura").getValue() === "") {
						sap.m.MessageToast.show("Preencher Quantidade de Fatura", {
							of : this.getView().byId("inFatura")
						});
						oViewModel.setProperty("/validar", false);
						return;
					}
				}
			}

		},

		fillModel : function(that, oModelObject) {
			//  
			var oViewModel = this.getModel("objectView");
			oModelObject.NAME = that.byId("inName").getValue();
			oModelObject.DESCRIPTION = that.byId("inDescr").getValue();

			// Aba interfaces
			if (that.byId("rbCCS").getSelected()) {
				var oTokenCCS = that.getView().byId('inCCS').getTokens();
				for (var i = 0; i < oTokenCCS.length; i++) {
					var token = oTokenCCS[i];
					oModelObject.INTEGRATION_CCS = token.getText();
				}				
//				oModelObject.INTEGRATION_CCS = that.byId("inCCS").getValue();
				oModelObject.LAYOUT_ID = 0;
			} else {
				var oTokenLayout = that.getView().byId('inTpLayout').getTokens();
				for (var i = 0; i < oTokenLayout.length; i++) {
					var token = oTokenLayout[i];
					oModelObject.LAYOUT_ID = token.getKey();
					oModelObject.LAYOUT_NAME = token.getText();
				}
				oModelObject.INTEGRATION_CCS = "";
			}
			oModelObject.ZBUKRS_NEG = that.byId("inEmpresa").getValue();
			oModelObject.ZMODELO = that.byId("inModelo").getValue();

			// Aba Serviço de Campo
			if (that.byId("cbServico").getSelected()) {
				oModelObject.IF_CAMP_SERVICE = 1;
				var oTokenServico = that.getView().byId('inTpServico').getTokens();
				for (var i = 0; i < oTokenServico.length; i++) {
					var token = oTokenServico[i];
					oModelObject.CAMP_ACTIVITY_ID = token.getKey();
					oModelObject.CAMP_ACTIVITY = token.getText();
				}

			} else {
				oModelObject.CAMP_ACTIVITY_ID = null;
				oModelObject.CAMP_ACTIVITY = "";
			}

			// Aba Orçamento
			oModelObject.BUDGET_COST_UNIT = parseFloat(that.byId("inCustoUnitario").getValue()).toFixed(2);

			// if (that.byId("rbQtdMes").getSelected()) {
			oModelObject.BUDGET_PROVIDE_MONTH = parseInt(that.byId("inQtdMensal").getValue());
			// oModelObject.BUDGET_PROVIDE_YEAR = 0;
			// } else {
			oModelObject.BUDGET_PROVIDE_YEAR = parseInt(that.byId("inQtdAnual").getValue());
			// oModelObject.BUDGET_PROVIDE_MONTH = 0;
			// }

			if (that.byId("rbContaContrato").getSelected()) {
				oModelObject.BUDGET_METHOD_SENDER = 1;
				oModelObject.BUDGET_METHOD_SEND_QTD = 0;
			} else {
				oModelObject.BUDGET_METHOD_SENDER = 2;
				oModelObject.BUDGET_METHOD_SEND_QTD = parseInt(that.byId("inFatura").getValue());
			}

			if (that.byId("rbEnvio").getSelected()) {
				oModelObject.BUDGET_METHOD_COUNT = 1;
			} else if (that.byId("rbConfirmacao").getSelected()) {
				oModelObject.BUDGET_METHOD_COUNT = 2;
			} else {
				oModelObject.BUDGET_METHOD_COUNT = 3;
			}

			oModelObject.EXECUTION_ORDER = 1;
			oModelObject.USR01_BNAME = 'CT16030';

		},

		onProcessar : function() {
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/isNew", false);
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", true);
			oViewModel.setProperty("/btApagarVisible", true);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/formEditable", true);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/btCancelarVisible", true);
		},
		onServicoHelp : function() {
			var oInput = this.getView().byId("inTpServico");
			var that = this;
			var oModel = this.getModel();
			// This code was generated by the layout editor.
			var oViewModel = this.getModel("objectView");
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueHelp", {
				// supportRanges: true,
				supportMultiselect : false,
				title : "Tipo de Serviço",
				key : "CAMP_ACTIVITY_ID",
				descriptionKey : "CAMP_ACTIVITY",
				ok : function(oEvent) {
					//  
					var aTokens = oEvent.getParameter("tokens");
					var key;
					debugger;
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						oViewModel.setProperty("/activID", token.getKey());
						key = token.getKey();
					}

					if (key) {
						var where = key;
						var filters = new Array();
						var filterByID = new sap.ui.model.Filter("CAMP_ACTIVITY_ID", sap.ui.model.FilterOperator.EQ, where);
						filters.push(filterByID);
						oModel.read("/equipeTipoServicoOData", {
							filters : filters,
							success : function(oResponseSucess) {
								that.aItemsCentro = [];
								for (var i = 0; i < oResponseSucess.results.length; i++) {
									var item = {};
									item.SERVICE_TEAM_ID = oResponseSucess.results[i].SERVICE_TEAM_ID;
									item.NAME = oResponseSucess.results[i].NAME;
									that.aItemsCentro.push(item);

								}
							},
							error : function(oResponseSucess) {

							}
						});
					}
					var oInputCentro = that.getView().byId("inCentro");
					oInputCentro.destroyTokens();
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
					label : "Tipo de Serviço",
					template : "CAMP_ACTIVITY"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			oTable.setModel(this.getModel());
			oTable.bindRows("/tipoServicoCampoOData");

			oValueHelp.open();
			oValueHelp.update();
		},
		onCCSHelp : function() {
			// This code was generated by the layout editor.

			var oInput = this.getView().byId("inCCS");
			var oViewModel = this.getModel("objectView");
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idCCSHelp", {
				supportMultiselect : false,
				supportRanges : false,
				supportRangesOnly : false,
				title : "Interface CCS",
//				key : "INTERFACE",
				descriptionKey : "INTERFACE",
				ok : function(oEventTipo) {
					var aTokens = oEventTipo.getParameter("tokens");

					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
//						oViewModel.setProperty("/layoutID", token.getKey());
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
					label : "Interface",
					template : "INTERFACE"
				}, {
					label : "Descrição",
					template : "DDTEXT"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			debugger;
			oTable.setModel(this.getModel());
			oTable.bindRows("/interfaceCCSOdata");
			oValueHelp.open();
			oValueHelp.update();

		},
		onLayoutHelp : function() {
			// This code was generated by the layout editor.

			var oInput = this.getView().byId("inTpLayout");
			var oViewModel = this.getModel("objectView");
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idLayoutHelp", {
				supportMultiselect : false,
				supportRanges : false,
				supportRangesOnly : false,
				title : "Tipo de Layout",
				key : "LAYOUT_ID",
				descriptionKey : "NAME",
				ok : function(oEventTipo) {
					var aTokens = oEventTipo.getParameter("tokens");

					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						oViewModel.setProperty("/layoutID", token.getKey());
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
					label : "Nome",
					template : "NAME"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			debugger;
			oTable.setModel(this.getModel());
			oTable.bindRows("/layoutOData");
			oValueHelp.open();
			oValueHelp.update();

		},
//		onEmpresaExemploHelp : function() {
//			// This code was generated by the layout editor.
//
//			var oInput = this.getView().byId("inEmpEx");
//			var oViewModel = this.getModel("objectView");
//			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idEmpExHelp", {
//				supportMultiselect : false,
//				supportRanges : false,
//				supportRangesOnly : false,
//				title : "Tipo de Layout",
//				key : "BUKRS",
//				descriptionKey : "BUTXT",
//				ok : function(oEventTipo) {
//					var aTokens = oEventTipo.getParameter("tokens");
//
//					for (var i = 0; i < aTokens.length; i++) {
//						var token = aTokens[i];
//						oInput.setTokens(aTokens);
//					}
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
//					label : "Nome",
//					template : "BUTXT"
//				} ]
//			});
//
//			var oTable = oValueHelp.getTable();
//			oTable.setModel(oColModel, "columns");
//
//			debugger;
//            // Begin of Filterbar handling #########################################
//            var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
//                advancedMode: false,
//                filterBarExpanded: false, //sap.ui.Device.system.phone,
//                //showGoOnFB: !sap.ui.Device.system.phone,
//                search: function(oEvent) {
//                    var aSearchItems = oEvent.mParameters.selectionSet;
//                    var sMsg;
//                    if (this.getBasicSearch()) {
//                        sMsg = sap.ui.getCore().byId(this.getBasicSearch()).getValue();
//                        for (var i = 0; i < aSearchItems.length; i++) {
//                            sMsg += "/" + aSearchItems[i].getValue();
//                        }
//                    }
//                    sap.m.MessageToast.show("Search pressed '" + sMsg + "'");
//                },
//                clear: function(oEvent) {
//                    sap.m.MessageToast.show("Clear pressed");
//                }
//            });
//
//            if (oFilterBar.setBasicSearch) {
//                oFilterBar.setBasicSearch(new sap.m.SearchField({
//                    showSearchButton: false,
//                    placeholder: "Search"
//                        search: function(event) {
//                        	oValueHelp.getFilterBar().search();
//                        } 
//                }));
//            }
//            oValueHelp.setFilterBar(oFilterBar);
//            
//			oTable.setModel(this.getModel());
//			oTable.bindRows("/empresaOData");
//			oValueHelp.open();
//			oValueHelp.update();
//
//		},
		onCentroHelp1 : function() {
			var that = this;
			var oInput = this.getView().byId("inCentro");
			debugger;
			var dataRows1 = [];
			var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				basicSearchText : this.getView().byId("inCentro").getValue(),
				title : "Centro de Trabalho",
				supportMultiselect : true,
				key : "SERVICE_TEAM_ID",
				descriptionKey : "NAME",
				stretch : sap.ui.Device.system.phone,

				ok : function(oControlEvent) {
					that.aTokens = oControlEvent.getParameter("tokens");
					oInput.setTokens(that.aTokens);

					oValueHelpDialog.close();
				},

				cancel : function(oControlEvent) {
					oValueHelpDialog.close();
				},

				afterClose : function() {
					oValueHelpDialog.destroy();
				}
			});

			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols : [ {
					label : "Id",
					template : "SERVICE_TEAM_ID"
				}, {
					label : "Nome",
					template : "NAME"
				} ]
			});
			oValueHelpDialog.getTable().setModel(oColModel, "columns");

			var oRowsModel = new sap.ui.model.json.JSONModel();

			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
              advancedMode: false,
              filterBarExpanded: false, //sap.ui.Device.system.phone,
              //showGoOnFB: !sap.ui.Device.system.phone,
              search: function(oEvent) {
                  var aSearchItems = oEvent.mParameters.selectionSet;
                  var sMsg;
                  if (this.getBasicSearch()) {
                      sMsg = sap.ui.getCore().byId(this.getBasicSearch()).getValue();
                      for (var i = 0; i < aSearchItems.length; i++) {
                          sMsg += aSearchItems[i].getValue();
                      }
                  }
                  debugger;
//                  sap.m.MessageToast.show("Search pressed '" + sMsg + "'");
                  var dataRows1 = that.myfilter(that.aItemsCentro, function(currentHome){
                	     
                	    return currentHome.NAME.includes(sMsg);
                	});  
      			oRowsModel.setData(dataRows1);
    			oValueHelpDialog.getTable().setModel(oRowsModel);
    			if (oValueHelpDialog.getTable().bindRows) {
    				oValueHelpDialog.getTable().bindRows("/");
    			}                  
              },
              clear: function(oEvent) {
            	  var dataRows1 = [];
              }
          });

          if (oFilterBar.setBasicSearch) {
              oFilterBar.setBasicSearch(new sap.m.SearchField({
                  showSearchButton: false,
                  placeholder: "Search",
                      search: function(event) {
                    	  oValueHelpDialog.getFilterBar().search();
                      } 
              }));
          }
          
          oValueHelpDialog.setFilterBar(oFilterBar);			
			
			if(dataRows1.length === 0){
				for (var i = 0; i < this.aItemsCentro.length; i++) {
					var data = {};
					data.SERVICE_TEAM_ID = this.aItemsCentro[i].SERVICE_TEAM_ID.toString();
					data.NAME = this.aItemsCentro[i].NAME;
					dataRows1.push(data);
				}
				debugger;				
			}
			

			oRowsModel.setData(dataRows1);
			oValueHelpDialog.getTable().setModel(oRowsModel);
			if (oValueHelpDialog.getTable().bindRows) {
				oValueHelpDialog.getTable().bindRows("/");
			}

			var aTokens = oInput.getTokens();
			oValueHelpDialog.setTokens(aTokens);

			oValueHelpDialog.addStyleClass("sapUiSizeCozy");

			oValueHelpDialog.open();
			oValueHelpDialog.update();
		},
		 myfilter: function(array, test){
		    var passedTest =[];
		    for (var i = 0; i < array.length; i++) {
		       if(test( array[i]))
		          passedTest.push(array[i]);
		    }

		    return passedTest;
		},
		onOpenLayout : function() {
			window.open("/accs/ui5/layoutFields/webapp/", "_blank");
		},

		onChangeServico : function() {
			debugger;
			this.getView().byId("inCentro").destroyTokens();
		},

		/*
		 * 
		 * ----------------------------- Rotinas para Popup Programação
		 * ------------------------------------
		 * 
		 */
		_getDialog : function() {
			// create dialog lazily
			if (!this._oDialog) {
				// create dialog via fragment factory
				this._oDialog = sap.ui.xmlfragment(this.getView().getId(), "com.cpfl.canalnot.view.programacao", this);
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},

		onSaveProg : function() {
			var that = this;
			var oModelProg = [];
			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");
			debugger;
			oModelProg = this._onfillProg(that);
			var ok = this._validProgramacao(that);
			debugger;
			if (ok) {
				for (var i = 0; i < oModelProg.length; i++) {
					debugger;
					console.log(JSON.stringify(oModelProg[i]));
					var oModelTemp = {};
					oModelTemp.CHANNEL_ID = oModelProg[i].CHANNEL_ID;
					oModelTemp.VALUE_TYPE = "PROGRAMACAO";
					debugger;
					oModelTemp.PROGRAM_DATA = oModelProg[i].PROGRAM_DATA;
					oModelTemp.DAY = oModelProg[i].DAY;
					oModelTemp.MONTH = oModelProg[i].MONTH;
					oModelTemp.MONTH_NAME = oModelProg[i].MONTH_NAME;
					oModelTemp.YEAR = oModelProg[i].YEAR;
					oModelTemp.VALOR = oModelProg[i].VALOR.toString();

					oModel.create("/programacaoCanalOData", oModelTemp, {
						success : function(oResponseSuccess) {
							debugger;
							// sap.m.MessageBox.information("Programação salva
							// com sucesso!");
						},
						error : function(oResponseError) {
							debugger;
						}
					});
				}
				this.close();
			}

		},
		openMonth : function() {
			var oViewModel = this.getModel("objectView"), oView = this.getView(), oElementBinding = oView.getElementBinding();
			var oModel = this.getModel();
			var that = this;
			var flag = true;
			var editable = oViewModel.getProperty("/formEditable");

			this._onclearFieldsProg(false);
			debugger;
			var sPath = oElementBinding.getBoundContext().getPath();
			oModel.read(sPath + "/programacaoCanal", {
				success : function(oResponseSuccess) {
					debugger;
					var size = oResponseSuccess.results.length;
					debugger;
					if (size > 0) {
						for (var i = 0; i < size; i++) {
							if (oResponseSuccess.results[i].MONTH.length < 2) {
								oResponseSuccess.results[i].MONTH = "0" + oResponseSuccess.results[i].MONTH;
							}
							if (oResponseSuccess.results[i].DAY.length < 2) {
								oResponseSuccess.results[i].DAY = "0" + oResponseSuccess.results[i].DAY;
							}							
							if ( (oResponseSuccess.results[i].MONTH == that.getView().byId('comboMes').getSelectedKey()
									&& oResponseSuccess.results[i].YEAR == that.getView().byId('inAno').getValue().toString())									
							|| (	oResponseSuccess.results[i].MONTH 	=== '01' && 
									oResponseSuccess.results[i].DAY 	=== '01' &&
									oResponseSuccess.results[i].YEAR 	=== that.getView().byId('inAno').getValue().toString()) ) {
								that._validaSaldo(that, oResponseSuccess.results[i], true);
								flag = false;
							}
						}

						if (flag) {
							that.getView().byId('inQtdMes').setValue(oViewModel.getProperty("/saldoMesBase"));
						}
					}
				}
			});

		},
		onChangeValue : function (oEvent){
		debugger;
		if (this.getView().byId("comboMes").getValue() === "") {
			sap.m.MessageToast.show("Preencher Mês", {
				of : this.getView().byId("comboMes")
			});''
			return;

		}
		this.onCalcProg();
		},
		onOpenProgramacao : function() {
			var oViewModel = this.getModel("objectView"), oView = this.getView(), oElementBinding = oView.getElementBinding();
			var oObject = oView.getBindingContext().getObject();
			var oModel = this.getModel();
			var that = this;
			var isNew = oViewModel.getProperty("/isNew");

			if (oObject.IF_CAMP_SERVICE && !this.byId("cbServico").getSelected()) {
				sap.ui.commons.MessageBox.alert("Canal deverá ser salvo antes de criar Programação");
				return;
			} else if (this.byId("cbServico").getSelected()) {
				sap.ui.commons.MessageBox.alert("Programação não habilitada para serviço de campo");
				return;
			}

			if (!isNew) {
				this._getDialog().open();
				this._onclearFieldsProg(true);
				var sPath = oElementBinding.getBoundContext().getPath();
				debugger;
				var d = new Date();
				debugger;
				var mes = d.getMonth() + 1;
				var dateStr = d.getDate() + "/" + mes + "/" + d.getFullYear();
				this.byId("inToday").setValue(dateStr);	
				debugger;
				oModel.read(sPath + "/programacaoCanal", {
					// oModel.read(path, {
					success : function(oResponseSuccess) {
						debugger;
						var size = oResponseSuccess.results.length;
						var soma = 0;
						var ano = 0;
						if (size > 0) {
							for (var i = 0; i < size; i++) {
								var somaMes = 0;
								somaMes = that._validaSaldoInicial(that, oResponseSuccess.results[i], false, somaMes);
								if (somaMes) {
									soma = soma + somaMes;
								}

							}
							that.getView().byId('inQtdMes').setValue(that.getView().byId('inQtdMensal').getValue());
							debugger;
							if (soma > 0) {
								ano = parseInt(that.getView().byId('inQtdAnual').getValue()) - soma;
								if (ano < 0)
									ano = 0;
								that.getView().byId('inQtdAno').setValue(ano);
							} else {
								that.getView().byId('inQtdAno').setValue(that.getView().byId('inQtdAnual').getValue());
							}
							// that.getView().byId('inQtdMes').setValue(that.getView().byId('inQtdMensal').getValue());

							// that.getView().byId('inQtdMes').setValue(that.getView().byId('inQtdMensal').getValue());
							oViewModel.setProperty("/saldoMesBase", that.getView().byId('inQtdMes').getValue());
							oViewModel.setProperty("/saldoAnoBase", that.getView().byId('inQtdAno').getValue());
						}
					}
				});

			} else {
				sap.ui.commons.MessageBox.alert(this._oResourceBundle.getText("alertProgram"));
			}
		},

		close : function() {
			var oViewModel = this.getModel();
			oViewModel.setProperty("saldoMesBase", "");
			oViewModel.setProperty("saldoAnoBase", "");
			this._getDialog().close();
		},

		onCalcProg : function() {
			var that = this;

			this._onCalcSaldos(that);

		},

		_validaSaldo : function(that, oResponseSuccess, open) {
			switch (oResponseSuccess.VALUE_TYPE) {
			case 'SALDO_MENSAL':
				that.getView().byId('inQtdMes').setValue(oResponseSuccess.VALOR);
				// var qtdAno = parseInt(oResponseSuccess.VALOR) * 12;
				// that.getView().byId('inQtdAno').setValue(qtdAno);
				break;

			case 'SALDO_ANUAL':
				that.getView().byId('inQtdAno').setValue(oResponseSuccess.VALOR);
				// var qtdMes = parseInt(oResponseSuccess.VALOR) / 12;
				// that.getView().byId('inQtdMes').setValue(qtdMes);
				break;
			case 'PROGRAMACAO':
				if (open) {
					var diaProg = oResponseSuccess.DAY;

					this._fillDaysProgr(oResponseSuccess, diaProg);
					that.getView().byId("comboMes").setSelectedKey(oResponseSuccess.MONTH);
				}
				break;
			default:
				break;
			}
		},

		_validaSaldoInicial : function(that, oResponseSuccess, open, somatorio) {
			debugger;
			switch (oResponseSuccess.VALUE_TYPE) {
			case 'SALDO_MENSAL':
				that.getView().byId('inQtdMes').setValue(oResponseSuccess.VALOR);
				// var qtdAno = parseInt(oResponseSuccess.VALOR) * 12;
				// that.getView().byId('inQtdAno').setValue(qtdAno);
				somatorio = somatorio + (parseInt(that.getView().byId('inQtdMensal').getValue()) - parseInt(that.getView().byId('inQtdMes').getValue()));
				return somatorio;
				break;

			case 'SALDO_ANUAL':
				// that.getView().byId('inQtdAno').setValue(oResponseSuccess.VALOR);
				// var qtdMes = parseInt(oResponseSuccess.VALOR) / 12;
				// that.getView().byId('inQtdMes').setValue(qtdMes);
				break;
			case 'PROGRAMACAO':
				if (open) {
					var diaProg = oResponseSuccess.DAY;
					this._fillDaysProgr(oResponseSuccess, diaProg);
					that.getView().byId("comboMes").setSelectedKey(oResponseSuccess.MONTH);
				}
				break;
			default:
				break;
			}
		},

		_validProgramacao : function(that) {
			var ok = true;
			var saldoMes = 0;
			var oViewModel = this.getModel("objectView");
			var saldobkp = oViewModel.getProperty("/saldoMesBase")
			if (that.byId("comboMes").getSelectedKey() === "") {
				sap.m.MessageToast.show("Escolha um mês", {
					of : this.getView().byId("comboMes")
				});
				ok = false;
				return ok;

			}
			debugger;
			if (that.getView().byId("in01").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in01").getValue());
			}

			if (that.getView().byId("in02").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in02").getValue());
			}

			if (that.getView().byId("in03").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in03").getValue());
			}

			if (that.getView().byId("in04").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in04").getValue());
			}

			if (that.getView().byId("in05").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in05").getValue());
			}

			if (that.getView().byId("in06").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in06").getValue());
			}

			if (that.getView().byId("in07").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in07").getValue());
			}

			if (that.getView().byId("in08").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in08").getValue());
			}

			if (that.getView().byId("in09").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in09").getValue());
			}

			if (that.getView().byId("in10").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in10").getValue());
			}

			if (that.getView().byId("in11").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in11").getValue());
			}

			if (that.getView().byId("in12").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in12").getValue());
			}

			if (that.getView().byId("in13").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in13").getValue());
			}

			if (that.getView().byId("in14").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in14").getValue());
			}

			if (that.getView().byId("in15").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in15").getValue());
			}

			if (that.getView().byId("in16").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in16").getValue());
			}

			if (that.getView().byId("in17").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in17").getValue());
			}

			if (that.getView().byId("in18").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in18").getValue());
			}

			if (that.getView().byId("in19").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in19").getValue());
			}

			if (that.getView().byId("in20").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in20").getValue());
			}

			if (that.getView().byId("in21").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in21").getValue());
			}

			if (that.getView().byId("in22").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in22").getValue());
			}

			if (that.getView().byId("in23").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in23").getValue());
			}

			if (that.getView().byId("in24").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in24").getValue());
			}

			if (that.getView().byId("in25").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in25").getValue());
			}

			if (that.getView().byId("in26").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in26").getValue());
			}

			if (that.getView().byId("in27").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in27").getValue());
			}

			if (that.getView().byId("in28").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in28").getValue());
			}

			if (that.getView().byId("in29").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in29").getValue());
			}

			if (that.getView().byId("in30").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in30").getValue());
			}

			if (that.getView().byId("in31").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in31").getValue());
			}

			if (saldoMes === 0) {
				sap.m.MessageToast.show("Necessário preencer ao menos um dia", {
					of : this.getView().byId("in01")
				});
				ok = false;
				return ok;

			}
			if (saldobkp < saldoMes) {
				var dif = saldoMes - parseInt(saldobkp);
				sap.m.MessageBox.information("Valores superam o saldo mensal em " + dif + " unidades");
				ok = false;
				return ok;
			}

			return ok;
		},
		_onfillProg : function(that) {
			var oModelProg = [];
			var oFields = [];
			var oViewModel = that.getModel("objectView");
			//		

			if (that.getView().byId("in01").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "01", "in01", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in02").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "02", "in02", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in03").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "03", "in03", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in04").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "04", "in04", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in05").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "05", "in05", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in06").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "06", "in06", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in07").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "07", "in07", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in08").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "08", "in08", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in09").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "09", "in09", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in10").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "10", "in10", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in11").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "11", "in11", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in12").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "12", "in12", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in13").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "13", "in13", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in14").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "14", "in14", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in15").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "15", "in15", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in16").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "16", "in16", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in17").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "17", "in17", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in18").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "18", "in18", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in19").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "19", "in19", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in20").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "20", "in20", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in21").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "21", "in21", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in22").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "22", "in22", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in23").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "23", "in23", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in24").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "24", "in24", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in25").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "25", "in25", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in26").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "26", "in26", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in27").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "27", "in27", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in28").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "28", "in28", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in29").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "29", "in29", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in30").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "30", "in30", oFields);
				oModelProg.push(oFields);
			}

			if (that.getView().byId("in31").getValue()) {
				oFields = [];
				oFields.CHANNEL_ID = oViewModel.getProperty("/channelID");
				this._fillFieldsData(that, "31", "in31", oFields);
				oModelProg.push(oFields);
			}
			return oModelProg;
		},

		_fillFieldsData : function(that, day, id, oFields) {
			debugger;
			var date = new Date();
			var mes = parseInt(that.byId("comboMes").getSelectedKey()) - 1;
			date.setMonth(mes);
			date.setDate(day);
			oFields.PROGRAM_DATA = date;
			oFields.DAY = day;
			oFields.MONTH = that.byId("comboMes").getSelectedKey();
			oFields.MONTH_NAME = that.byId("comboMes").getValue();
			debugger;
//			oFields.YEAR = '' + date.getFullYear() + '';
			oFields.YEAR = that.byId("inAno").getValue().toString();
			oFields.VALOR = parseInt(that.byId(id).getValue());
		},

		_onclearFieldsProg : function(newPage) {
			if (newPage) {
				debugger
				var date = new Date();				
				this.getView().byId("inAno").setValue(date.getFullYear());
//				var mes = date.getMonth();
//				if(mes < 10){
//					mes = "0" + mes;
//				}
				this.getView().byId("comboMes").setSelectedKey("");
				this.getView().byId("inQtdMes").setValue("");
				this.getView().byId("inQtdAno").setValue("");
			}
			this.getView().byId("in01").setValue("");
			this.getView().byId("in02").setValue("");
			this.getView().byId("in03").setValue("");
			this.getView().byId("in04").setValue("");
			this.getView().byId("in05").setValue("");
			this.getView().byId("in06").setValue("");
			this.getView().byId("in07").setValue("");
			this.getView().byId("in08").setValue("");
			this.getView().byId("in09").setValue("");
			this.getView().byId("in10").setValue("");
			this.getView().byId("in11").setValue("");
			this.getView().byId("in12").setValue("");
			this.getView().byId("in13").setValue("");
			this.getView().byId("in14").setValue("");
			this.getView().byId("in15").setValue("");
			this.getView().byId("in16").setValue("");
			this.getView().byId("in17").setValue("");
			this.getView().byId("in18").setValue("");
			this.getView().byId("in19").setValue("");
			this.getView().byId("in20").setValue("");
			this.getView().byId("in21").setValue("");
			this.getView().byId("in22").setValue("");
			this.getView().byId("in23").setValue("");
			this.getView().byId("in24").setValue("");
			this.getView().byId("in25").setValue("");
			this.getView().byId("in26").setValue("");
			this.getView().byId("in27").setValue("");
			this.getView().byId("in28").setValue("");
			this.getView().byId("in29").setValue("");
			this.getView().byId("in30").setValue("");
			this.getView().byId("in31").setValue("");
		},

		_onCalcSaldos : function(that) {
			var oModelProg = new Array();
			var oViewModel = this.getModel("objectView");
			var saldoMes = 0;
			var saldobkp = oViewModel.getProperty("/saldoMesBase");
			var saldoAno = oViewModel.getProperty("/saldoAnoBase");
			// var oViewModel = this.getModel("objectView");
			//		
			debugger;

			if (that.getView().byId("in01").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in01").getValue());
			}

			if (that.getView().byId("in02").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in02").getValue());
			}

			if (that.getView().byId("in03").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in03").getValue());
			}

			if (that.getView().byId("in04").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in04").getValue());
			}

			if (that.getView().byId("in05").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in05").getValue());
				;
			}

			if (that.getView().byId("in06").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in06").getValue());
			}

			if (that.getView().byId("in07").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in07").getValue());
			}

			if (that.getView().byId("in08").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in08").getValue());
			}

			if (that.getView().byId("in09").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in09").getValue());
			}

			if (that.getView().byId("in10").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in10").getValue());
			}

			if (that.getView().byId("in11").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in11").getValue());
			}

			if (that.getView().byId("in12").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in12").getValue());
			}

			if (that.getView().byId("in13").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in13").getValue());
			}

			if (that.getView().byId("in14").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in14").getValue());
			}

			if (that.getView().byId("in15").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in15").getValue());
			}

			if (that.getView().byId("in16").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in16").getValue());
			}

			if (that.getView().byId("in17").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in17").getValue());
			}

			if (that.getView().byId("in18").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in18").getValue());
			}

			if (that.getView().byId("in19").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in19").getValue());
			}

			if (that.getView().byId("in20").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in20").getValue());
			}

			if (that.getView().byId("in21").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in21").getValue());
			}

			if (that.getView().byId("in22").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in22").getValue());
			}

			if (that.getView().byId("in23").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in23").getValue());
			}

			if (that.getView().byId("in24").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in24").getValue());
			}

			if (that.getView().byId("in25").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in25").getValue());
			}

			if (that.getView().byId("in26").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in26").getValue());
			}

			if (that.getView().byId("in27").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in27").getValue());
			}

			if (that.getView().byId("in28").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in28").getValue());
			}

			if (that.getView().byId("in29").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in29").getValue());
			}

			if (that.getView().byId("in30").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in30").getValue());
			}

			if (that.getView().byId("in31").getValue()) {
				saldoMes = saldoMes + parseInt(that.getView().byId("in31").getValue());
			}

			if (saldobkp < saldoMes) {
				debugger;
				var dif = saldoMes - parseInt(saldobkp);
				sap.m.MessageBox.information("Valores superam o saldo mensal em " + dif + " unidades");
			} else {
				saldoAno = saldoAno - saldoMes;
				saldoMes = saldobkp - saldoMes;
				that.getView().byId('inQtdMes').setValue(saldoMes);

				that.getView().byId('inQtdAno').setValue(saldoAno);
			}

		},

		_fillDaysProgr : function(oResponse, day) {
			debugger;
			switch (day) {
			case '01':
				this.getView().byId("in01").setValue(oResponse.VALOR);
				break;
			case '02':
				this.getView().byId("in02").setValue(oResponse.VALOR);
				break;
			case '03':
				this.getView().byId("in03").setValue(oResponse.VALOR);
				break;
			case '04':
				this.getView().byId("in04").setValue(oResponse.VALOR);
				break;
			case '05':
				this.getView().byId("in05").setValue(oResponse.VALOR);
				break;
			case '06':
				this.getView().byId("in06").setValue(oResponse.VALOR);
				break;
			case '07':
				this.getView().byId("in07").setValue(oResponse.VALOR);
				break;
			case '08':
				this.getView().byId("in08").setValue(oResponse.VALOR);
				break;
			case '09':
				this.getView().byId("in09").setValue(oResponse.VALOR);
				break;
			case '10':
				this.getView().byId("in10").setValue(oResponse.VALOR);
				break;
			case '11':
				this.getView().byId("in11").setValue(oResponse.VALOR);
				break;
			case '12':
				this.getView().byId("in12").setValue(oResponse.VALOR);
				break;
			case '13':
				this.getView().byId("in13").setValue(oResponse.VALOR);
				break;
			case '14':
				this.getView().byId("in14").setValue(oResponse.VALOR);
				break;
			case '15':
				this.getView().byId("in15").setValue(oResponse.VALOR);
				break;
			case '16':
				this.getView().byId("in16").setValue(oResponse.VALOR);
				break;
			case '17':
				this.getView().byId("in17").setValue(oResponse.VALOR);
				break;
			case '18':
				this.getView().byId("in18").setValue(oResponse.VALOR);
				break;
			case '19':
				this.getView().byId("in19").setValue(oResponse.VALOR);
				break;
			case '20':
				this.getView().byId("in20").setValue(oResponse.VALOR);
				break;
			case '21':
				this.getView().byId("in21").setValue(oResponse.VALOR);
				break;
			case '22':
				this.getView().byId("in22").setValue(oResponse.VALOR);
				break;
			case '23':
				this.getView().byId("in23").setValue(oResponse.VALOR);
				break;
			case '24':
				this.getView().byId("in24").setValue(oResponse.VALOR);
				break;
			case '25':
				this.getView().byId("in25").setValue(oResponse.VALOR);
				break;
			case '26':
				this.getView().byId("in26").setValue(oResponse.VALOR);
				break;
			case '27':
				this.getView().byId("in27").setValue(oResponse.VALOR);
				break;
			case '28':
				this.getView().byId("in28").setValue(oResponse.VALOR);
				break;
			case '29':
				this.getView().byId("in29").setValue(oResponse.VALOR);
				break;
			case '30':
				this.getView().byId("in30").setValue(oResponse.VALOR);
				break;
			case '31':
				this.getView().byId("in31").setValue(oResponse.VALOR);
				break;
			default:
				break;
			}
		}
	});
});