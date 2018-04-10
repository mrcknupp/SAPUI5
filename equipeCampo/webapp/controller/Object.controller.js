/*global location*/
sap.ui.define([ "com/cpfl/equipecampo/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/vbm/AnalyticMap", "sap/ui/Device", "sap/ui/core/routing/History", "com/cpfl/equipecampo/model/formatter" ], function(BaseController, JSONModel, AnalyticMap, Device, History, formatter,
		MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("com.cpfl.equipecampo.controller.Object", {

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
				isNew : false,
				mensalVisible : false,
				diariaVisible : true,
				semanalVisible : false,
				identificador : "",
				coordenadas : false,
				helpServico : false,
				isFragment : "",
				distributionID : "",
				programacaoVisible : false,
				validar : true,
				validarProgramacao : true,
				urlDistribution : "",
				validFrom : "",
				validUntil : ""
			});

			var oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.getView().setModel(oDeviceModel, "device");

			this.aItemsCidade = [];
			this.aItemsCidadeFragment = [];
			this.aItemsBairroFragment = [];
			this.aItemsProgramacao = {};
			this.aItemsServico = [];
			this.aItemInstalacao = [];
			this.acao = [];
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

		onNavBack : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			var sPreviousHash = History.getInstance().getPreviousHash();
			this.getView().unbindElement();
			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
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
			if (sObjectId === "Novo") {
				this.clearObject();
				oViewModel.setProperty("/identificador", "Novo");
				oViewModel.setProperty("/programacaoVisible", false);
				var oView = this.getView();
				this.onProcessar();
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/isNew", true);
				oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("createViewTitle"));

				var acoesModel = {};
				acoesModel.tableItems = [];
				this.setModel(new JSONModel(acoesModel), "acoesModel");
				var bindingContext = oView.getBindingContext();
				if (bindingContext) {
					this.getView().unbindElement();
				}
				this.getModel().metadataLoaded().then(function() {
					var oEntry = oView.getModel().createEntry("servicoCampoOData");
					oView.setBindingContext(oEntry);

					this.getView().byId("inPaisCentro").setValue("BR");

				}.bind(this));
				oViewModel.setProperty("/busy", false);
			} else {
				this.aItemsCidade = [];
				this.aItemsCidadeFragment = [];
				this.aItemsBairroFragment = [];
				oViewModel.setProperty("/programacaoVisible", true);
				oViewModel.setProperty("/dateVisible", true);
				oViewModel.setProperty("/identificador", sObjectId);
				oViewModel.setProperty("/btProcessarVisible", true);
				oViewModel.setProperty("/btSalvarVisible", false);
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/btCancelarVisible", false);
				oViewModel.setProperty("/formEditable", false);
				oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("editViewTitle"));
				this.setModel(new JSONModel({
					tableItems : []
				}), "acoesModel");

				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("servicoCampoOData", {
						SERVICE_TEAM_ID : sObjectId
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
			var that = this;
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
						var oView = that.getView();
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
			var oViewModel = this.getModel("objectView"), oDataModel = this.getModel();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.SERVICE_TEAM_ID, sObjectName = oObject.NAME;
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
			var that = this;

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
			if (oObject.IF_OWN) {
				this.getView().byId("chkEquipe").setSelected(true);
			} else {
				this.getView().byId("chkEquipe").setSelected(false);
			}

			if (oObject.IF_ACTIVE) {
				this.getView().byId("chkAtivo").setSelected(true);
			} else {
				this.getView().byId("chkAtivo").setSelected(false);
			}

			if (oObject.IF_RURAL) {
				this.getView().byId("chkRural").setSelected(true);
			} else {
				this.getView().byId("chkRural").setSelected(false);
			}

			if (oObject.IF_URBAN) {
				this.getView().byId("chkUrbano").setSelected(true);
			} else {
				this.getView().byId("chkUrbano").setSelected(false);
			}

			if (oObject.IF_GEOREFERENCING) {
				this.getView().byId("chkGeo").setSelected(true);

			} else {
				this.getView().byId("chkGeo").setSelected(false);
			}

			this.getView().byId("inEstadoCentro").destroyTokens();
			var oToken = new sap.m.Token();
			if (oObject.REGION) {
				oToken.setKey(oObject.REGION);
				oToken.setText(oObject.REGION_NAME);
				this.getView().byId("inEstadoCentro").addToken(oToken);
			}

			this.getView().byId("inCidadeCentro").destroyTokens();
			var oToken = new sap.m.Token();
			if (oObject.REGION) {
				oToken.setKey(oObject.CITY_CODE);
				oToken.setText(oObject.CITY_NAME);
				this.getView().byId("inCidadeCentro").addToken(oToken);
			}

			var sPath = oElementBinding.getBoundContext().getPath(), oResourceBundle = this.getResourceBundle();

			oModel.read(sPath + "/tipoEquipeServicoCampoNav", {
				success : function(oResponseSucess) {
					that.getView().byId("inInstalacao").destroyTokens();

					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var oToken = new sap.m.Token();
						oToken.setKey(oResponseSucess.results[i].INSTALLATION_TYPE_ID);
						oToken.setText(oResponseSucess.results[i].INSTALLATION_TYPE);
						that.getView().byId("inInstalacao").addToken(oToken);
					}
				}
			});

			oModel.read(sPath + "/atividadeEquipeServicoCampoNav", {
				success : function(oResponseSucess) {
					that.getView().byId("inServico").destroyTokens();

					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var oToken = new sap.m.Token();
						oToken.setKey(oResponseSucess.results[i].CAMP_ACTIVITY_ID);
						oToken.setText(oResponseSucess.results[i].CAMP_ACTIVITY);
						that.getView().byId("inServico").addToken(oToken);
					}
				}
			});
			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData;
			if (!acoesModel) {
				oCoesModelData = {};
				oCoesModelData.tableItems = [];
				acoesModel = new JSONModel(oCoesModelData);
				this.setModel(acoesModel, "acoesModel");
			}
			
			// oModel.read("/tipoServicoCampoOData", {
			// success : function(oResponseSucess) {
			// that.aItemsServico = [];
			// for (var i = 0; i < oResponseSucess.results.length; i++) {
			// that.aItemsServico.push(oResponseSucess.results[i]);
			// }
			// }
			// });

			// oModel.read("/Tipo_instalacao_Odata", {
			// success : function(oResponseSucess) {
			// that.aItemInstalacao = [];
			// for (var i = 0; i < oResponseSucess.results.length; i++) {
			// that.aItemInstalacao.push(oResponseSucess.results[i]);
			// }
			// }
			// });

			oCoesModelData = acoesModel.getData();

			oModel.read(sPath + "/distribuicaoEquipeServicoCampoNav", {
				success : function(oResponseSucess) {
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var item = oResponseSucess.results[i];
						var validFrom = item.VALID_FROM.toISOString();
						item.VALID_FROM = validFrom.substring(8, 10) + "/" + validFrom.substring(5, 7) + "/" + validFrom.substring(0, 4);
						var validUntil = item.VALID_UNTIL.toISOString();
						item.VALID_UNTIL = validUntil.substring(8, 10) + "/" + validUntil.substring(5, 7) + "/" + validUntil.substring(0, 4);
						oCoesModelData.tableItems.push({
							DISTRIBUTION_ID : item.DISTRIBUTION_ID,
							VALID_FROM : item.VALID_FROM,
							VALID_UNTIL : item.VALID_UNTIL,
							SERVICE_TEAM_ID : item.SERVICE_TEAM_ID,
							SERVICE_TEAM_NAME : item.SERVICE_TEAM_NAME,
							USR01_BNAME : item.USR01_BNAME,
							COUNTRY : item.COUNTRY,
							REGION : item.REGION,
							REGION_NAME : item.REGION_NAME,
							CITY_CODE : item.CITY_CODE,
							CITY_NAME : item.CITY_NAME,
							CITYP_CODE : item.CITYP_CODE,
							CITYP_NAME : item.CITYP_NAME
						});

						acoesModel.setData(oCoesModelData);
					}

				}
			});
			oViewModel.setProperty("/urlDistribution", sPath);
			this.onPressGeo();

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [ sObjectName ]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [ sObjectId ]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [ sObjectName, sObjectId, location.href ]));
		},
		clearObject : function() {
			this.getView().byId("inCentroTrabalho").setValue("");
			this.getView().byId("inNomeCentroTrabalho").setValue("");
			this.getView().byId("inPaisCentro").setValue("");
			this.getView().byId("inExec").setValue("");
			this.getView().byId("inEstadoCentro").destroyTokens();
			this.getView().byId("inCidadeCentro").destroyTokens();
			this.getView().byId("chkGeo").setSelected(false);
			this.getView().byId("inLatitude").setValue("");
			this.getView().byId("inLongitude").setValue("");
			this.getView().byId("inCapacidade").setValue("");
			this.getView().byId("inCentroide").setValue("");
			this.getView().byId("chkEquipe").setSelected(false);
			this.getView().byId("chkAtivo").setSelected(false);
			this.getView().byId("inInstalacao").destroyTokens();
			this.getView().byId("inServico").destroyTokens();
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
			this.getView().byId("inBasket").setValue(null);
			this.getView().byId("inRaioMin").setValue("");
			this.getView().byId("inRaioMax").setValue("");
			this.getView().byId("inIncremento").setValue("");
			this.onRadioPress();

		},

		onServicoHelp : function() {
			var oInput2 = this.getView().byId("inServico");
			var oModel = this.getModel();
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueHelp", {
				supportMultiselect : true,
				title : "Tipo de serviço",
				key : "CAMP_ACTIVITY_ID",
				descriptionKey : "CAMP_ACTIVITY",
				ok : function(oEventModel) {
					var aTokens2 = oEventModel.getParameter("tokens");
					oInput2.setTokens(aTokens2);
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
					template : "CAMP_ACTIVITY"
				},

				{
					label : "Código do serviço",
					template : "CAMP_ACTIVITY_ID"
				}

				]
			});
			oValueHelp.getTable().setModel(oColModel, "columns");
			var oRowsModel = new sap.ui.model.json.JSONModel();
			
			oModel.read("/tipoServicoCampoOData", {
				success : function(oResponseSucess) {
					var aItems = [];
					// that.aItemsServico = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						aItems.push(oResponseSucess.results[i]);
					}
					var dataRows1 = [];
					for (var i = 0; i < aItems.length; i++) {
						var data = {};
						data.CAMP_ACTIVITY_ID = aItems[i].CAMP_ACTIVITY_ID.toString();
						data.CAMP_ACTIVITY = aItems[i].CAMP_ACTIVITY;
						dataRows1.push(data);
					}
					
					oRowsModel.setData(dataRows1);
					oValueHelp.getTable().setModel(oRowsModel);
					if (oValueHelp.getTable().bindRows) {
						oValueHelp.getTable().bindRows("/");
					}
					var aTokens = oInput2.getTokens();
					oValueHelp.setTokens(aTokens);

					oValueHelp.addStyleClass("sapUiSizeCozy");
					oValueHelp.open();
					oValueHelp.update();
				}
			});

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
			oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("changeViewTitle"));
			// oViewModel.setProperty("/viewTitle",
			// this.getView().getModel("i18n").getResourceBundle().getText("changeViewTitle"));
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
			oViewModel.setProperty("/buttonVisible", false);
			oViewModel.setProperty("/viewTitle", this.getView().getModel("i18n").getResourceBundle().getText("editViewTitle"));
			// oViewModel.setProperty("/viewTitle",
			// this.getView().getModel("i18n").getResourceBundle().getText("editViewTitle"));
			this.getView().unbindElement();
			this.onNavBack();
			// this._bindView(sPath);

		},

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

		onInstalacaoHelp : function() {
			// This code was generated by the layout editor.
			var oInput2 = this.getView().byId("inInstalacao");
			var oViewModel = this.getModel("objectView");
			var oModel = this.getModel();
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueInstalacao", {
				supportMultiselect : true,
				title : "Tipo de instalação",
				key : "INSTALLATION_TYPE_ID",
				descriptionKey : "INSTALLATION_TYPE",
				ok : function(oEventModel) {
					var aTokens2 = oEventModel.getParameter("tokens");
					oInput2.setTokens(aTokens2);
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
					label : "Codigo do tipo de instalação",
					template : "INSTALLATION_TYPE_ID"
				}, {
					label : "Tipo de instalação",
					template : "INSTALLATION_TYPE"
				} ]
			});
			oValueHelp.getTable().setModel(oColModel, "columns");
			var oRowsModel = new sap.ui.model.json.JSONModel();
			oModel.read("/Tipo_instalacao_Odata", {
				success : function(oResponseSucess) {
					var aItems = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						aItems.push(oResponseSucess.results[i]);
					}
					var dataRows1 = [];
					for (var i = 0; i < aItems.length; i++) {
						var data = {};
						data.INSTALLATION_TYPE_ID = aItems[i].INSTALLATION_TYPE_ID.toString();
						data.INSTALLATION_TYPE = aItems[i].INSTALLATION_TYPE;
						dataRows1.push(data);
					}
					
					oRowsModel.setData(dataRows1);
					oValueHelp.getTable().setModel(oRowsModel);
					if (oValueHelp.getTable().bindRows) {
						oValueHelp.getTable().bindRows("/");
					}
					var aTokens = oInput2.getTokens();
					oValueHelp.setTokens(aTokens);
					oValueHelp.addStyleClass("sapUiSizeCozy");
					oValueHelp.open();
					oValueHelp.update();
				}
			});

			// var oTable2 = oValueHelp.getTable();
			// oTable2.setModel(oColModel, "columns");
			// oTable2.setModel(this.getModel());
			// oTable2.bindRows("/Tipo_instalacao_Odata");
			// var aTokens = oInput2.getTokens();
			// oValueHelp.setTokens(aTokens);
			// oValueHelp.open();
			// oValueHelp.update();
		},

		onPressGeo : function() {
			var oViewModel = this.getModel("objectView");
			// This code was generated by the layout editor.
			if (this.byId("chkGeo").getSelected()) {
				oViewModel.setProperty("/coordenadas", true);
			} else {
				oViewModel.setProperty("/coordenadas", false);

			}

		},

		_validateObject : function() {
			var oViewModel = this.getModel("objectView");
			var required = oViewModel.getProperty("/tipoSelecao");
			var required2 = oViewModel.getProperty("/inMensal");
			oViewModel.setProperty("/validar", true);

			if (this.byId("radioSemanal").getSelected()) {
				if (this.byId("chkSDomingo").getSelected() === false && this.byId("chkSSegunda").getSelected() === false && this.byId("chkSTerca").getSelected() === false && this.byId("chkSQuarta").getSelected() === false && this.byId("chkSQuinta").getSelected() === false
						&& this.byId("chkSSexta").getSelected() === false && this.byId("chkSSabado").getSelected() === false) {
					sap.m.MessageToast.show("Selecionar ao menos um dia.", {
						of : this.getView().byId("radioSemanal")
					});
					oViewModel.setProperty("/validar", false);
					return;
				}
			}

			if (this.byId("inCentroTrabalho").getValue() === "") {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inCentroTrabalho")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}
			
			
			if (this.byId("inQtdBasket").getValue() < 0) {
				sap.m.MessageToast.show("Valor da quantidade cesta não pode ser negativo", {
					of : this.getView().byId("inQtdBasket")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			var oTokensEstado = this.getView().byId("inEstadoCentro").getTokens();
			if (oTokensEstado.length === 0) {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inEstadoCentro")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			var oTokensCidade = this.getView().byId("inCidadeCentro").getTokens();
			if (oTokensCidade.length === 0) {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inCidadeCentro")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			if (this.getView().byId("chkGeo").getSelected()) {

				if (this.byId("inLatitude").getValue() === "") {
					sap.m.MessageToast.show("Campo obrigatório", {
						of : this.getView().byId("inLatitude")
					});
					oViewModel.setProperty("/validar", false);
					return;

				}

				if (this.byId("inLongitude").getValue() === "") {
					sap.m.MessageToast.show("Campo obrigatório", {
						of : this.getView().byId("inLongitude")
					});
					oViewModel.setProperty("/validar", false);
					return;

				}

			}

			if (this.byId("inCapacidade").getValue() === "") {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inCapacidade")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}
			if (this.byId("inCapacidade").getValue() < 0) {
				sap.m.MessageToast.show("Valor inválido", {
					of : this.getView().byId("inCapacidade")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			if (this.byId("inExec").getValue() < 0) {
				sap.m.MessageToast.show("Valor inválido", {
					of : this.getView().byId("inExec")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			if (this.byId("inCentroide").getValue() === "") {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inCentroide")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

			if (this.byId("inBasket").getSelectedKey() === "") {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inBasket")
				});
				oViewModel.setProperty("/validar", false);
				return;

			}

		},

		validateProgramacao : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/validarProgramacao", true);

			if (this.getView().byId("inValidoDesdeFragment").getValue() === "") {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inValidoDesdeFragment")
				});
				oViewModel.setProperty("/validarProgramacao", false);
				return;

			}

			if (this.getView().byId("inValidoAteFragment").getValue() === "") {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inValidoAteFragment")
				});
				oViewModel.setProperty("/validarProgramacao", false);
				return;

			}

			var oTokensEstado = this.getView().byId("inUF").getTokens();
			if (oTokensEstado.length === 0) {
				sap.m.MessageToast.show("Campo obrigatório", {
					of : this.getView().byId("inUF")
				});
				oViewModel.setProperty("/validarProgramacao", false);
				return;

			}

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
				model.SERVICE_TEAM_ID = oViewModel.getProperty("/identificador");
				model.SERVICE_TEAM_ID = null;
				model.NAME = this.getView().byId("inCentroTrabalho").getValue();
				model.DESCRIPTION = this.getView().byId("inNomeCentroTrabalho").getValue();

				if (this.getView().byId("chkEquipe").getSelected()) {
					model.IF_OWN = 1;
					model.IF_OWN_DESCRIPTION = "Sim";
				} else {
					model.IF_OWN = 0;
					model.IF_OWN_DESCRIPTION = "Não";
				}

				if (this.getView().byId("chkAtivo").getSelected()) {
					model.IF_ACTIVE = 1;
					model.IF_ACTIVE_DESCRIPTION = "Sim";
				} else {
					model.IF_ACTIVE = 0;
					model.IF_ACTIVE_DESCRIPTION = "Não";
				}
				
				if (this.getView().byId("chkRural").getSelected()) {
					model.IF_RURAL = 1;
				} else {
					model.IF_RURAL = 0;
				}

				if (this.getView().byId("chkUrbano").getSelected()) {
					model.IF_URBAN = 1;
				} else {
					model.IF_URBAN = 0;
				}

				model.RADIUS_MIN = parseInt(this.getView().byId("inRaioMin").getValue());
				model.RADIUS_MAX = parseInt(this.getView().byId("inRaioMax").getValue());
				model.RADIUS_INCREMENT = parseInt(this.getView().byId("inIncremento").getValue());

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

				model.EXECUTION_ORDER = this.byId("inExec").getValue();
				model.COUNTRY = "BR";

				var oTokenRegion = this.getView().byId('inEstadoCentro').getTokens();
				for (var i = 0; i < oTokenRegion.length; i++) {
					var token = oTokenRegion[i];
					model.REGION = token.getKey();
					model.REGION_NAME = token.getText().substring(0, 20);
				}

				var oTokenCity = this.getView().byId('inCidadeCentro').getTokens();
				for (var i = 0; i < oTokenCity.length; i++) {
					var token = oTokenCity[i];
					model.CITY_CODE = token.getKey();
					model.CITY_NAME = token.getText().substring(0, 40);
				}

				model.QTD_CENTROID = parseInt(this.getView().byId("inCentroide").getValue());
				model.BASKET_PRIORITIZATION = parseInt(this.getView().byId("inBasket").getSelectedKey());
				model.CAPACITY = parseInt(this.getView().byId("inCapacidade").getValue());

				model.QTD_BASKET = this.getView().byId("inQtdBasket").getValue();

				if (this.getView().byId("chkGeo").getSelected()) {
					model.IF_GEOREFERENCING = 1;
					model.BASE_LATITUDE = this.getView().byId("inLatitude").getValue();
					model.BASE_LONGITUDE = this.getView().byId("inLongitude").getValue();
				} else {
					model.IF_GEOREFERENCING = 0;
					model.BASE_LATITUDE = null;
					model.BASE_LONGITUDE = null;
				}

				// var that = this;
				debugger;
				if (isNew) {
					var genId = oModel.read("/genServiceTeamID ", {
						success : function(oResponseSucess) {

							model.SERVICE_TEAM_ID = oResponseSucess.results[0].GEN_SERVICE_TEAM_ID;

							// Salva o registro
							console.log(JSON.stringify(model));
							oModel.create("/servicoCampoOData", model, {
								async : false,
								success : function(oData, response) {
									oModel.refresh();
									var oTipoInstalacao = that.getView().byId("inInstalacao").getTokens();
									if (oTipoInstalacao.length > 0) {
										for (var i = 0; i < oTipoInstalacao.length; i++) {
											var tipoEquipeModel = {};
											var token = oTipoInstalacao[i];
											tipoEquipeModel.SERVICE_TEAM_ID = model.SERVICE_TEAM_ID;
											tipoEquipeModel.INSTALLATION_TYPE_ID = token.getKey();
											tipoEquipeModel.INSTALLATION_TYPE = token.getText();

											oModel.create("/tipoEquipeServicoCampoOData", tipoEquipeModel, {
												async : true,
												success : function(oData, response) {
													oModel.refresh();
												},
												error : function(oResponseError) {
												}
											});
										}

									}
									var oTipoServico = that.getView().byId("inServico").getTokens();
									if (oTipoServico.length > 0) {
										for (var i = 0; i < oTipoServico.length; i++) {
											var tipoServicoModel = {};
											var token2 = oTipoServico[i];
											tipoServicoModel.SERVICE_TEAM_ID = model.SERVICE_TEAM_ID;
											tipoServicoModel.CAMP_ACTIVITY_ID = token2.getKey();
											tipoServicoModel.CAMP_ACTIVITY = token2.getText();

											oModel.create("/atividadeEquipeServicoCampoOData", tipoServicoModel, {
												async : true,
												success : function(oData, response) {
												},
												error : function(oResponseError) {
												}
											});

										}

									}

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
					model.SERVICE_TEAM_ID = oViewModel.getProperty("/identificador");
					model.SERVICE_TEAM_ACTIVITY = [];
					model.SERVICE_TEAM_TYPE = [];

					var oTipoInstalacao = that.getView().byId("inInstalacao").getTokens();
					if (oTipoInstalacao.length > 0) {
						for (var i = 0; i < oTipoInstalacao.length; i++) {
							var tipoEquipeModel = {};
							var token = oTipoInstalacao[i];
							tipoEquipeModel.INSTALLATION_TYPE_ID = token.getKey();
							model.SERVICE_TEAM_TYPE.push(tipoEquipeModel);
						}

					}
					var oTipoServico = that.getView().byId("inServico").getTokens();
					if (oTipoServico.length > 0) {
						for (var i = 0; i < oTipoServico.length; i++) {
							var tipoServicoModel = {};
							var token2 = oTipoServico[i];
							tipoServicoModel.CAMP_ACTIVITY_ID = token2.getKey();
							model.SERVICE_TEAM_ACTIVITY.push(tipoServicoModel);

						}

					}
					
					jQuery.ajax({
						url : "/accs/services/updateServiceTeam.xsjs",
						method : 'PUT',
						data : JSON.stringify(model),
						contentType : 'application/json; charset=utf-8',

						success : function(oData, response) {

							oModel.refresh();
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

		onDeletar : function() {
			var oComponent = this.getOwnerComponent(), oModel = this.getModel();
			var that = this;
			var oViewModel = this.getModel("objectView");
			var action_id = oViewModel.getProperty("/identificador");

			sap.m.MessageBox.confirm("Deseja excluir ?", {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// Apaga o registro
						var jsonModel = sap.ui.getCore().getModel("editModel");
						var sPath = "/servicoCampoOData(" + action_id + ")";
						oModel.remove(sPath);
						// Volta para a tela inicial
						that.onNavBack();
					}
				}
			});

		},

		onDeleteActionRow : function(e) {
			var that = this;
			var oTable = this.byId("tblCoordenadas");
			var oItems = oTable.getSelectedItems();
			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData = acoesModel.getData();
			var oTable = this.byId("tblCoordenadas");
			var oItems = oTable.getSelectedItems();
			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData = acoesModel.getData();
			var deleteItem = {};

			if (oItems.length === 0) {
				sap.m.MessageBox.alert("Selecionar um item primeiro.");
			}

			for (var i = 0; i < oItems.length; i++) {
				var item = oItems[i];
				var sPath = item.getBindingContextPath();
				var index = sPath.replace(/[^0-9\.]/g, '');
				deleteItem = oCoesModelData.tableItems[index];
				// oCoesModelData.tableItems.splice(index, 1);
				// acoesModel.setData(oCoesModelData);

			}
			var validFrom = new Date();
			validFrom.setDate(deleteItem.VALID_FROM.substring(0, 2));
			var mes = deleteItem.VALID_FROM.substring(3, 5) - 1;
			validFrom.setMonth(mes);
			validFrom.setFullYear(deleteItem.VALID_FROM.substring(6, 10));

			var date = validFrom.toISOString();
			var subvalid_from = date.substring(0, 11);
			var horas = "00:00:00.0000000";
			deleteItem.VALID_FROM = subvalid_from + horas;

			// Deleta da interface
			var oComponent = this.getOwnerComponent(), oModel = this.getModel();
			sap.m.MessageBox.confirm("Deseja excluir ?", {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// Apaga o registro
						var jsonModel = sap.ui.getCore().getModel("editModel");
						var sPathDelete = "/distribuicaoEquipeServicoCampoOData(DISTRIBUTION_ID=" + deleteItem.DISTRIBUTION_ID + ")";
						oModel.remove(sPathDelete);
						that.refreshTable();
						// Volta para a tela inicial
					}
				}
			});

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
				title : "Estado do centro de trabalho",
				key : "CODIGO_UF",
				descriptionKey : "UF",
				ok : function(oEventCanal) {
					var aTokens = oEventCanal.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
						oViewModel.setProperty("/estadoID", token.getKey());
						var key = token.getKey();
					}
					if (key) {
						var where = key;
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

					oValueHelp.close();
					var oInputCidade = that.getView().byId("inCidadeCentro");
					oInputCidade.destroyTokens();
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
			oTable.bindRows("/ufOData");
			oValueHelp.open();
			oValueHelp.update();
		},

		onEstadoFragmentHelp : function() {
			// This code was generated by the layout editor.
			var that = this;
			var oModel = this.getModel();
			var oInput = this.getView().byId("inUF");
			var oViewModel = this.getModel("objectView");
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
					if (key) {
						var where = key;
						var filters = new Array();
						var filterByID = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, where);
						filters.push(filterByID);
						oModel.read("/cidadeOData", {
							filters : filters,
							success : function(oResponseSucess) {
								that.aItemsCidadeFragment = [];
								for (var i = 0; i < oResponseSucess.results.length; i++) {
									that.aItemsCidadeFragment.push(oResponseSucess.results[i]);

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
			oTable.bindRows("/ufOData");
			oValueHelp.open();
			oValueHelp.update();
		},

		onCityFragmentHelp : function() {
			// This code was generated by the layout editor.
			var that = this;
			var oInput = this.getView().byId("inMunicipio");
			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");

			var oInputCity = this.getView().byId("inUF").getTokens();
			if (oInputCity.length === 0) {
				sap.m.MessageToast.show("Preencher primeiro o Estado", {
					of : this.getView().byId("inUF")
				});
				return;
			}
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idCityHelp", {
				basicSearchText : oInput.getValue(),
				supportMultiselect : false,
				filterMode : true,
				title : "Município",
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
									that.aItemsBairroFragment = [];
									for (var i = 0; i < oResponseSucess.results.length; i++) {
										that.aItemsBairroFragment.push(oResponseSucess.results[i]);

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

			if (that.aItemsCidadeFragment.length === 0) {
				var oTokenRegion = this.getView().byId("inUF").getTokens();
				for (var i = 0; i < oTokenRegion.length; i++) {
					var token = oTokenRegion[i];
					var where = token.getKey();
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					oModel.read("/cidadeOData", {
						filters : filters,
						success : function(oResponseSucess) {
							for (var i = 0; i < oResponseSucess.results.length; i++) {
								that.aItemsCidadeFragment.push(oResponseSucess.results[i]);

							}

							oRowsModel.setData(that.aItemsCidadeFragment);
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

			oRowsModel.setData(that.aItemsCidadeFragment);
			oTable.setModel(oRowsModel);
			if (oTable.bindRows) {
				oTable.bindRows("/");
			}

			oValueHelp.addStyleClass("sapUiSizeCozy");
			oValueHelp.open();
			oValueHelp.update();
		},

		onBairroFragmentHelp : function() {
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
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idCityHelp", {
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

			if (that.aItemsBairroFragment.length === 0) {
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
								that.aItemsBairroFragment.push(oResponseSucess.results[i]);

							}
							var sortedTable = that.aItemsBairroFragment.sort(function(a, b) {
								var nameA = a.BAIRRO.toLowerCase(), nameB = b.BAIRRO.toLowerCase();
								if (nameA < nameB) // sort string ascending
									return -1;
								if (nameA > nameB)
									return 1;
								return 0; // default return value (no sorting)
							});

							oRowsModel.setData(sortedTable);
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

			var sortedTable = that.aItemsBairroFragment.sort(function(a, b) {
				var nameA = a.BAIRRO.toLowerCase(), nameB = b.BAIRRO.toLowerCase();
				if (nameA < nameB) // sort string ascending
					return -1;
				if (nameA > nameB)
					return 1;
				return 0; // default return value (no sorting)
			});

			oRowsModel.setData(sortedTable);
			oTable.setModel(oRowsModel);
			if (oTable.bindRows) {
				oTable.bindRows("/");
			}

			oValueHelp.addStyleClass("sapUiSizeCozy");
			oValueHelp.open();
			oValueHelp.update();
		},

		onCityHelp : function() {
			// This code was generated by the layout editor.
			var that = this;
			var oModel = this.getModel();
			var oInput = this.getView().byId("inCidadeCentro");
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
				title : "Cidade do centro de trabalho",
				key : "CODIGO_CIDADE",
				descriptionKey : "CIDADE",
				ok : function(oEventCanal) {
					var aTokens = oEventCanal.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						oInput.setTokens(aTokens);
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
					template : "CODIGO_CIDADE"
				}, {
					label : "Cidade",
					template : "CIDADE"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");
			var oInputUF = that.getView().byId("inEstadoCentro").getTokens();
			var oRowsModel = new sap.ui.model.json.JSONModel();
			if (that.aItemsCidade.length === 0 && oInputUF.length > 0) {
				var oTokenRegion = this.getView().byId('inEstadoCentro').getTokens();
				for (var i = 0; i < oTokenRegion.length; i++) {
					var token = oTokenRegion[i];
					var where = token.getKey();
					var filters = new Array();
					var filterByID = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, where);
					filters.push(filterByID);
					oModel.read("/cidadeOData", {
						filters : filters,
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

		onFragmentFilterAcaoSelect : function() {
			var that = this;
			var oColModel = new sap.ui.model.json.JSONModel();
			var oView = this.getView();
			var oViewModel = this.getModel("objectView");
			var oDialog = oView.byId("valueHelpProgramacao");
			var oModel = this.getModel();
			that.validateProgramacao();
			
			var ok = oViewModel.getProperty("/validarProgramacao");
			if (ok) {

				if (oViewModel.getProperty("/isFragment") === "Create") {

					that.fillModel(that, that.aItemsProgramacao);

					var acoesModel = this.getModel("acoesModel");
					var oCoesModelData;
					if (!acoesModel) {
						oCoesModelData = {};
						oCoesModelData.tableItems = [];
						acoesModel = new JSONModel(oCoesModelData);
						this.setModel(acoesModel, "acoesModel");
					}

					oCoesModelData = acoesModel.getData();

					var validFrom = that.aItemsProgramacao.VALID_FROM;
					var mesFrom = validFrom.getMonth();
					if (mesFrom < 10) {
						mesFrom = "0" + mesFrom;
					}

					var diaFrom = validFrom.getDate();
					if (diaFrom < 10) {
						diaFrom = "0" + diaFrom;
					}
					validFrom = diaFrom + "/" + mesFrom + "/" + validFrom.getFullYear();

					var validUntil = that.aItemsProgramacao.VALID_UNTIL;
					var mesUntil = validUntil.getMonth();
					if (mesUntil < 10) {
						mesUntil = "0" + mesUntil;
					}
					var diaUntil = validUntil.getDate();
					if (diaUntil < 10) {
						diaUntil = "0" + diaUntil;
					}
					validUntil = diaUntil + "/" + mesUntil + "/" + validUntil.getFullYear();
					;
					acoesModel.setData(oCoesModelData);
					// Grava os dados
					var genId = oModel.read("/genDistributionID ", {
						success : function(oResponseSucess) {
							oModel.refresh();
							var items = {};
							items.DISTRIBUTION_ID = oResponseSucess.results[0].GEN_DISTRIBUTION_ID;
							items.VALID_FROM = that.aItemsProgramacao.VALID_FROM;
							items.VALID_UNTIL = that.aItemsProgramacao.VALID_UNTIL;
							items.SERVICE_TEAM_ID = parseInt(oViewModel.getProperty("/identificador"));
							items.SERVICE_TEAM_NAME = that.aItemsProgramacao.SERVICE_TEAM_NAME;
							items.USR01_BNAME = "CT16030";
							items.COUNTRY = "BR";
							items.REGION = that.aItemsProgramacao.REGION;
							items.REGION_NAME = that.aItemsProgramacao.REGION_NAME.substring(0, 20);
							items.CITY_CODE = that.aItemsProgramacao.CITY_CODE;
							items.CITY_NAME = that.aItemsProgramacao.CITY_NAME.substring(0, 40);
							items.CITYP_CODE = that.aItemsProgramacao.CITYP_CODE;
							items.CITYP_NAME = that.aItemsProgramacao.CITYP_NAME.substring(0, 40);
							oModel.create("/distribuicaoEquipeServicoCampoOData", items, {
								async : true,
								success : function(oData, response) {
									that.refreshTable();
									oModel.refresh();
								},
								error : function(oResponseError) {
									sap.ui.commons.MessageBox.alert("Erro ao gravar");
								}
							});

						},
						error : function(oResponseError) {
							sap.ui.commons.MessageBox.alert("Erro ao gerar ID");
						}
					});

					oDialog.close();
					oDialog.destroy();
				} else {
					// Update
					that.fillModel(that, that.aItemsProgramacao);

					// var validFrom = that.aItemsProgramacao.VALID_FROM;
					// var date = validFrom.toISOString();
					// var subvalid_from = date.substring(0, 11);
					// var horas = "00:00:00.0000000";
					// validFrom = subvalid_from + horas;

					// oModel.update("/distribuicaoEquipeServicoCampoOData(DISTRIBUTION_ID="
					// + that.aItemsProgramacao.DISTRIBUTION_ID +
					// ",VALID_FROM=datetime'" + validFrom + "')",
					// that.aItemsProgramacao, {
					oModel.update("/distribuicaoEquipeServicoCampoOData(DISTRIBUTION_ID=" + that.aItemsProgramacao.DISTRIBUTION_ID + ")", that.aItemsProgramacao, {
						merge : false,
						success : function(oData, response) {
							sap.m.MessageBox.information("Registro alterado com sucesso!");
							that.refreshTable();
							oModel.refresh();
						},
						error : function(oResponseError) {
							sap.ui.commons.MessageBox.alert("Erro ao atualizar");
							// var xmlDoc =
							// jQuery.parseXML(oResponseError.responseText);
							// var txtErro =
							// xmlDoc.getElementsByTagName("DETAIL")[0].childNodes[0];
							//
							// MessageBox.error(txtErro.data, {
							// id : "serviceErrorMessageBox",
							// details :
							// xmlDoc.getElementsByTagName("message")[0].childNodes[0].data,
							// actions : [ MessageBox.Action.CLOSE ],
							// onClose : function() {
							// oViewModel.setProperty("/busy", false);
							// }.bind(this)
							// });
						}
					});

					oDialog.close();
					oDialog.destroy();

				}
			}
		},

		refreshTable : function() {

			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");

			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData;
			if (!acoesModel) {
				oCoesModelData = {};
				oCoesModelData.tableItems = [];
				acoesModel = new JSONModel(oCoesModelData);
				this.setModel(acoesModel, "acoesModel");
			}

			oCoesModelData = acoesModel.getData();
			var oItems = oCoesModelData.tableItems.length;
			oCoesModelData.tableItems.splice(0, oItems);
			acoesModel.setData(oCoesModelData);

			var sPath = oViewModel.getProperty("/urlDistribution");
			oModel.read(sPath + "/distribuicaoEquipeServicoCampoNav", {
				success : function(oResponseSucess) {
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var item = oResponseSucess.results[i];
						var validFrom = item.VALID_FROM.toISOString();
						item.VALID_FROM = validFrom.substring(8, 10) + "/" + validFrom.substring(5, 7) + "/" + validFrom.substring(0, 4);
						var validUntil = item.VALID_UNTIL.toISOString();
						item.VALID_UNTIL = validUntil.substring(8, 10) + "/" + validUntil.substring(5, 7) + "/" + validUntil.substring(0, 4);
						oCoesModelData.tableItems.push({
							DISTRIBUTION_ID : item.DISTRIBUTION_ID,
							VALID_FROM : item.VALID_FROM,
							VALID_UNTIL : item.VALID_UNTIL,
							SERVICE_TEAM_ID : item.SERVICE_TEAM_ID,
							SERVICE_TEAM_NAME : item.SERVICE_TEAM_NAME,
							USR01_BNAME : item.USR01_BNAME,
							COUNTRY : item.COUNTRY,
							REGION : item.REGION,
							REGION_NAME : item.REGION_NAME,
							CITY_CODE : item.CITY_CODE,
							CITY_NAME : item.CITY_NAME,
							CITYP_CODE : item.CITYP_CODE,
							CITYP_NAME : item.CITYP_NAME
						});

						acoesModel.setData(oCoesModelData);
					}

				}
			});

		},

		onPressIncluirAcao : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/isFragment", "Create");

			var oView = this.getView();
			var oDialog = oView.byId("valueHelpProgramacao");
			var oViewModel = this.getModel("objectView");

			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.cpfl.equipecampo.view.Programacao", this);
				oView.addDependent(oDialog);
			}
			var d = new Date();
			
			var mes = d.getMonth() + 1;
			if (mes < 10) {
				mes = "0" + mes;
			}
			var dateStr = d.getDate() + "/" + mes + "/" + d.getFullYear();
			this.byId("inValidoDesdeFragment").setValue(dateStr);
			this.byId("inValidoAteFragment").setValue("31/12/9999");
			this.byId("inUF").destroyTokens();
			this.byId("inMunicipio").destroyTokens();
			this.byId("inBairro").destroyTokens();

			var oTable = this.byId("tableFragmentAcao");

			oDialog.setEscapeHandler(function() {
				oDialog.close();
				oDialog.destroy();
			});
			oDialog.open();

		},

		onChangeEstado : function() {
			this.getView().byId("inCidadeCentro").destroyTokens();
			this.aItemsCidade = [];

		},

		onChangeEstadoFragment : function() {
			this.getView().byId("inMunicipio").destroyTokens();
			this.getView().byId("inBairro").destroyTokens();
			this.aItemsCidadeFragment = [];
		},

		onChangeMunicipioFragment : function() {
			this.getView().byId("inBairro").destroyTokens();
			this.aItemsBairroFragment = [];

		},

		fillModel : function(that, aItemsProgramacao) {
			
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern : "dd/MM/yyyy"
			});
			var oViewModel = this.getModel("objectView");
			if (oViewModel.getProperty("/isFragment") === "Update") {
				that.aItemsProgramacao.DISTRIBUTION_ID = parseInt(oViewModel.getProperty("/distributionID"));
				// var validFrom = new Date(), validUntil = new Date();
				// var dateFrom = oViewModel.getProperty("/validFrom");
				// validFrom.setDate(dateFrom.substring(0, 2));
				// var mes = dateFrom.substring(3, 5) - 1;
				// validFrom.setMonth(mes);
				// validFrom.setFullYear(dateFrom.substring(6, 10));
				//
				// var dateUntil = oViewModel.getProperty("/validUntil");
				// validUntil.setDate(dateUntil.substring(0, 2));
				// var mes = dateUntil.substring(3, 5) - 1;
				// validUntil.setMonth(mes);
				// validUntil.setFullYear(dateUntil.substring(6, 10));

				// that.aItemsProgramacao.VALID_FROM = validFrom;
				// that.aItemsProgramacao.VALID_UNTIL = validUntil;
			} else {
				that.aItemsProgramacao.DISTRIBUTION_ID = null;
				// var strDataDesde =
				// dateFormat.parse(this.byId("inValidoDesdeFragment").getValue());
				// var strDataAte =
				// dateFormat.parse(this.byId("inValidoAteFragment").getValue());
				// that.aItemsProgramacao.VALID_FROM = new Date(strDataDesde);
				// that.aItemsProgramacao.VALID_UNTIL = new Date(strDataAte);
			}
			var strDataDesde = dateFormat.parse(this.byId("inValidoDesdeFragment").getValue());
			var strDataAte = dateFormat.parse(this.byId("inValidoAteFragment").getValue());
			that.aItemsProgramacao.VALID_FROM = new Date(strDataDesde);
			that.aItemsProgramacao.VALID_UNTIL = new Date(strDataAte);

			that.aItemsProgramacao.SERVICE_TEAM_ID = parseInt(oViewModel.getProperty("/identificador"));
			that.aItemsProgramacao.SERVICE_TEAM_NAME = this.getView().byId("inCentroTrabalho").getValue();
			that.aItemsProgramacao.USR01_BNAME = "CT16030";
			that.aItemsProgramacao.COUNTRY = "BR";

			var oTokenUF = this.getView().byId("inUF").getTokens();
			for (var i = 0; i < oTokenUF.length; i++) {
				var token = oTokenUF[i];
				that.aItemsProgramacao.REGION = token.getKey();
				that.aItemsProgramacao.REGION_NAME = token.getText();
			}

			var oTokenMunicipio = this.getView().byId("inMunicipio").getTokens();
			if (oTokenMunicipio.length > 0) {
				for (var i = 0; i < oTokenMunicipio.length; i++) {
					var token = oTokenMunicipio[i];
					that.aItemsProgramacao.CITY_CODE = token.getKey();
					that.aItemsProgramacao.CITY_NAME = token.getText();
				}
			} else {
				that.aItemsProgramacao.CITY_CODE = "";
				that.aItemsProgramacao.CITY_NAME = "";
			}

			var oTokenBairro = this.getView().byId("inBairro").getTokens();
			if (oTokenBairro.length > 0) {
				for (var i = 0; i < oTokenBairro.length; i++) {
					var token = oTokenBairro[i];
					that.aItemsProgramacao.CITYP_CODE = token.getKey();
					that.aItemsProgramacao.CITYP_NAME = token.getText();
				}
			} else {
				that.aItemsProgramacao.CITYP_CODE = "";
				that.aItemsProgramacao.CITYP_NAME = "";
			}

		},

		onFragmentCancel : function() {
			var oView = this.getView();
			var oDialog = oView.byId("valueHelpProgramacao");
			oDialog.close();
		},

		onPressAlterarProgamacao : function(oEvent) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/isFragment", "Update");
			var oTable = this.getView().byId("tblCoordenadas");
			var oItems = oTable.getSelectedItems();
			var acoesModel = this.getModel("acoesModel");
			var oCoesModelData = acoesModel.getData();
			var oView = this.getView();
			var oDialog = oView.byId("valueHelpProgramacao");
			var acoesObject = acoesModel.getData();
			var tableItems = acoesObject.tableItems;

			if (oItems.length === 0) {
				sap.m.MessageBox.alert("Selecionar um item primeiro.");
			}

			for (var i = 0; i < oItems.length; i++) {
				var item = oItems[i];
				var sPath = item.getBindingContextPath();
				var index = sPath.replace(/[^0-9\.]/g, '');
			}

			var items = tableItems[index];

			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.cpfl.equipecampo.view.Programacao", this);
				oView.addDependent(oDialog);
			}
			oViewModel.setProperty("/distributionID", items.DISTRIBUTION_ID);
			oViewModel.setProperty("/validFrom", items.VALID_FROM);
			oViewModel.setProperty("/validUntil", items.VALID_UNTIL);
			this.getView().byId("inValidoDesdeFragment").setValue(items.VALID_FROM);
			this.getView().byId("inValidoAteFragment").setValue(items.VALID_UNTIL);

			this.getView().byId("inUF").destroyTokens();
			var oToken = new sap.m.Token();
			if (items.REGION) {
				oToken.setKey(items.REGION);
				oToken.setText(items.REGION_NAME);
				this.getView().byId("inUF").addToken(oToken);
			}

			this.getView().byId("inMunicipio").destroyTokens();
			var oToken = new sap.m.Token();
			if (items.CITY_CODE) {
				oToken.setKey(items.CITY_CODE);
				oToken.setText(items.CITY_NAME);
				this.getView().byId("inMunicipio").addToken(oToken);
			}

			this.getView().byId("inBairro").destroyTokens();
			var oToken = new sap.m.Token();
			if (items.CITYP_CODE) {
				oToken.setKey(items.CITYP_CODE);
				oToken.setText(items.CITYP_NAME);
				this.getView().byId("inBairro").addToken(oToken);
			}

			oDialog.setEscapeHandler(function() {
				oDialog.close();
				oDialog.destroy();
			});
			oDialog.open();

		}

	});

});