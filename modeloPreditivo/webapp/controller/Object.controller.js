/*global location*/
sap.ui.define([ "com/cpfl/modelos/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/modelos/model/formatter" ], function(BaseController, JSONModel, History, formatter) {
	"use strict";

	var that;
	return BaseController.extend("com.cpfl.modelos.controller.Object", {
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
			// Model used to manipulate control
			// states. The chosen values make
			// sure,
			// detail page is busy indication
			// immediately so there is no break
			// in
			// between the busy indication for
			// loading the view's meta data

			that = this;

			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				btProcessarVisible : true,
				btSalvarVisible : false,
				btApagarVisible : false,
				btCancelarVisible : false,
				formEditable : false,
				isNew : false,
				rbDay : true,
				rbWeek : false,
				rbMonth : false,
				chkDayVisible : true,
				chkWeekVisible : false,
				chkMonthVisible : false,
				chkDayEditable : true,
				chkWeekEditable : false,
				chkMonthVEditable : false,
				chkDSat : false,
				chkDSun : false,
				chkDHol : false,
				chkWSat : false,
				chkWSun : false,
				chkWMon : false,
				chkWTue : false,
				chkWWed : false,
				chkWThu : false,
				chkWFri : false,
				rbauto : true,
				rbexper : false,
				autoVisible : true,
				autoEditable : false,
				expertVisible : true,
				expertEditable : false,
				areaAbrang : false,
				areaSQL : false,
				valueAbrang : " ",
				valueSQL : " ",
				valPadrao1: false,
				valPadrao2: false,
				valueDateFrom : " "
			// title: " "
			});

			this.eArrayKey = [];

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// Store original busy indicator
			// delay, so it can be restored
			// later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function() {
				// Restore
				// original busy
				// indicator
				// delay for the
				// object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			var oRefreshSelect = this.getView().byId("comboTipoModel");
			oRefreshSelect.addButton(new sap.m.Button({
				text : "Atualizar",
				press : this.onRefreshList
			}));

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
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			this.onClearFields();
			this.getView().unbindElement();
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
			var oViewModel = this.getModel("objectView");
			var oView = this.getView();
			var sObjectId = oEvent.getParameter("arguments").objectId;

			if (sObjectId === "Create") {

				oViewModel.setProperty("/title", this.getView().getModel("i18n").getResourceBundle().getText("createModel"));
				this.getModel().metadataLoaded().then(function() {
					var oEntry = oView.getModel().createEntry("modeloPreditivoOData");
					oView.setBindingContext(oEntry);
					this.onCreateLayout();
				}.bind(this));				
				oViewModel.setProperty("/busy", false);

			} else {
				oViewModel.setProperty("/title", this.getView().getModel("i18n").getResourceBundle().getText("displayModel"));
				var array = sObjectId.split("#");
				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("modeloPreditivoOData", {
						PREDICTIVE_MODEL_ID : array[0],
						VALID_FROM : array[1]
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
			that = this;
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
						var PREDICTIVE_MODEL_ID = oObject.PREDICTIVE_MODEL_ID;
						// Montar Tokens
						if (oObject.TYPE_MODEL === 1) {

							//var oAkeyToken = new sap.m.Token();
							//oAkeyToken.setText(oObject.FIELD_KEY);
							//that.getView().byId("inAKey").destroyTokens();
							//that.getView().byId("inAKey").setValue(" ");
							//that.getView().byId("inAKey").addToken(oAkeyToken);

							//var oAResultToken = new sap.m.Token();
							//oAResultToken.setText(oObject.FIELD_RESULT);
							//that.getView().byId("inAResult").destroyTokens();
							//that.getView().byId("inAResult").setValue(" ");
							//that.getView().byId("inAResult").addToken(oAResultToken);

						} else {

							var oProcToken = new sap.m.Token();
							oProcToken.setText(oObject.PROCEDURE_MODEL);
							that.getView().byId("inProcedure").destroyTokens();
							that.getView().byId("inProcedure").setValue("");
							that.getView().byId("inProcedure").addToken(oProcToken);

							var oEkeyToken = new sap.m.Token();
							oEkeyToken.setText(oObject.FIELD_KEY);
							that.getView().byId("inEKey").destroyTokens();
							that.getView().byId("inEKey").setValue("");
							that.getView().byId("inEKey").addToken(oEkeyToken);

							var oEResultToken = new sap.m.Token();
							oEResultToken.setText(oObject.FIELD_RESULT);
							that.getView().byId("inEResult").destroyTokens();
							that.getView().byId("inEResult").setValue("");
							that.getView().byId("inEResult").addToken(oEResultToken);
						}
						//						
						that.onDisplayLayout();
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_onBindingChange : function() {
			var oView = this.getView(), oViewModel = this.getModel("objectView"), oElementBinding = oView.getElementBinding();
			var oObject = oView.getBindingContext().getObject();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			// Montar Tokens
			if (oObject.TYPE_MODEL === 1) {

//				var oAkeyToken = new sap.m.Token();
//				oAkeyToken.setText(oObject.FIELD_KEY);
//				that.getView().byId("inAKey").destroyTokens();
//				that.getView().byId("inAKey").setValue(" ");
//				that.getView().byId("inAKey").addToken(oAkeyToken);
//
//				var oAResultToken = new sap.m.Token();
//				oAResultToken.setText(oObject.FIELD_RESULT);
//				that.getView().byId("inAResult").destroyTokens();
//				that.getView().byId("inAResult").setValue(" ");
//				that.getView().byId("inAResult").addToken(oAResultToken);

			} else {

				var oProcToken = new sap.m.Token();
				oProcToken.setText(oObject.PROCEDURE_MODEL);
				that.getView().byId("inProcedure").destroyTokens();
				that.getView().byId("inProcedure").setValue("");
				that.getView().byId("inProcedure").addToken(oProcToken);

				var oEkeyToken = new sap.m.Token();
				oEkeyToken.setText(oObject.FIELD_KEY);
				that.getView().byId("inEKey").destroyTokens();
				that.getView().byId("inEKey").setValue("");
				that.getView().byId("inEKey").addToken(oEkeyToken);

				var oEResultToken = new sap.m.Token();
				oEResultToken.setText(oObject.FIELD_RESULT);
				that.getView().byId("inEResult").destroyTokens();
				that.getView().byId("inEResult").setValue("");
				that.getView().byId("inEResult").addToken(oEResultToken);
			}
			//	
			this.onDisplayLayout();
			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.PREDICTIVE_MODEL_ID, sObjectName = oObject.NAME;
			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [ sObjectName ]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [ sObjectId ]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [ sObjectName, sObjectId, location.href ]));
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onCreateLayout : function() {
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/isNew", true);
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", true);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/formEditable", true);
			oViewModel.setProperty("areaAbrang", true);
			oViewModel.setProperty("areaSQL", true);
			oViewModel.setProperty("/chkDayVisible", true);
			oViewModel.setProperty("/chkWeekVisible", false);
			oViewModel.setProperty("/chkMonthVisible", false);
			oViewModel.setProperty("/chkDayEditable", true);
			oViewModel.setProperty("/chkWeekEditable", false);
			oViewModel.setProperty("/chkMonthEditable", false);
			oViewModel.setProperty("/rbDay", true);
			oViewModel.setProperty("/rbWeek", false);
			oViewModel.setProperty("/rbMonth", false);
			// Setar Datas
			var isNew = oViewModel.getProperty("/isNew");
			if (isNew === true) { 
				debugger;
				this.getView().byId("inSQL").setValue("Carregar somente arquivos com extensão .txt");
				this.getView().byId("inAbrang").setValue("Carregar somente arquivos com extensão .txt");
				oViewModel.setProperty("/valPadrao1", true);
				oViewModel.setProperty("/valPadrao2", true);				
			}			
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth()+1;
			var yyyy = today.getFullYear();
			if(dd<10) {
			    dd='0'+dd
			}
			if(mm<10) {
			    mm='0'+mm
			}
			today = dd+mm+yyyy;
//			var oView = this.getView();
//			var oObject = oView.getBindingContext().getObject();
//			oObject.VALID_FROM = today;
//			oObject.VALID_UNTIL = "31129999";
			this.getView().byId("dtValidFrom").setValue(today);
			this.getView().byId("dtValidTo").setValue("31129999");
			this.onDayly();
			this.onAuto();
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onDisplayLayout : function() {
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/isNew", false);
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			oViewModel.setProperty("areaAbrang", false);
			oViewModel.setProperty("areaSQL", false);
			oViewModel.setProperty("/chkDayEditable", false);
			oViewModel.setProperty("/chkWeekEditable", false);
			oViewModel.setProperty("/chkMonthEditable", false);

			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			// Periodicidade
			if (oObject.TRIGGER_PERIODICITY === "D") {
				oViewModel.setProperty("/chkDayVisible", true);
				oViewModel.setProperty("/chkWeekVisible", false);
				oViewModel.setProperty("/chkMonthVisible", false);
				oViewModel.setProperty("/rbDay", true);
				oViewModel.setProperty("/rbWeek", false);
				oViewModel.setProperty("/rbMonth", false);
				oViewModel.setProperty("/chkDSat", oObject.TRIGGER_SAT);
				oViewModel.setProperty("/chkDSun", oObject.TRIGGER_SUN);
				oViewModel.setProperty("/chkDHol", oObject.TRIGGER_HOLIDAY);
				oViewModel.setProperty("/chkWSat", false);
				oViewModel.setProperty("/chkWSun", false);
				oViewModel.setProperty("/chkWMon", false);
				oViewModel.setProperty("/chkWTue", false);
				oViewModel.setProperty("/chkWWed", false);
				oViewModel.setProperty("/chkWThu", false);
				oViewModel.setProperty("/chkWFri", false);
			}
			if (oObject.TRIGGER_PERIODICITY === "S") {
				oViewModel.setProperty("/chkDayVisible", false);
				oViewModel.setProperty("/chkWeekVisible", true);
				oViewModel.setProperty("/chkMonthVisible", false);
				oViewModel.setProperty("/rbDay", false);
				oViewModel.setProperty("/rbWeek", true);
				oViewModel.setProperty("/rbMonth", false);
				oViewModel.setProperty("/chkDSat", false);
				oViewModel.setProperty("/chkDSun", false);
				oViewModel.setProperty("/chkDHol", false);
				oViewModel.setProperty("/chkWSat", oObject.TRIGGER_SAT);
				oViewModel.setProperty("/chkWSun", oObject.TRIGGER_SUN);
				oViewModel.setProperty("/chkWMon", oObject.TRIGGER_MON);
				oViewModel.setProperty("/chkWTue", oObject.TRIGGER_TUE);
				oViewModel.setProperty("/chkWWed", oObject.TRIGGER_WED);
				oViewModel.setProperty("/chkWThu", oObject.TRIGGER_THU);
				oViewModel.setProperty("/chkWFri", oObject.TRIGGER_FRI);
			}
			if (oObject.TRIGGER_PERIODICITY === "M") {
				oViewModel.setProperty("/chkDayVisible", false);
				oViewModel.setProperty("/chkWeekVisible", false);
				oViewModel.setProperty("/chkMonthVisible", true);
				oViewModel.setProperty("/rbDay", false);
				oViewModel.setProperty("/rbWeek", false);
				oViewModel.setProperty("/rbMonth", true);
			}
			// Tipo de Modelo SAP PA
			if (oObject.TYPE_MODEL === 1) {
				oViewModel.setProperty("/rbauto", true);
				oViewModel.setProperty("/rbexper", false);
				this.onAuto();
			}
			if (oObject.TYPE_MODEL === 2) {
				oViewModel.setProperty("/rbauto", false);
				oViewModel.setProperty("/rbexper", true);
				this.onExpert();
			}
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onProcessar : function() {
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/title", this.getView().getModel("i18n").getResourceBundle().getText("changeModel"));
			// Ajusta os botões
			oViewModel.setProperty("/isNew", false);
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", true);
			oViewModel.setProperty("/btApagarVisible", true);
			oViewModel.setProperty("/btCancelarVisible", true);
			oViewModel.setProperty("/formEditable", true);
			oViewModel.setProperty("areaAbrang", true);
			oViewModel.setProperty("areaSQL", true);
			// Obter VALID_FROM
			oViewModel.setProperty("/valueDateFrom", this.byId("dtValidFrom").getValue());
			//						
			// Periodicidade
			if (oObject.TRIGGER_PERIODICITY === "D") {
				oViewModel.setProperty("/chkDayVisible", true);
				oViewModel.setProperty("/chkWeekVisible", false);
				oViewModel.setProperty("/chkMonthVisible", false);
				oViewModel.setProperty("/chkDayEditable", true);
				oViewModel.setProperty("/chkWeekEditable", false);
				oViewModel.setProperty("/chkMonthEditable", false);
			}
			if (oObject.TRIGGER_PERIODICITY === "S") {
				oViewModel.setProperty("/chkDayVisible", false);
				oViewModel.setProperty("/chkWeekVisible", true);
				oViewModel.setProperty("/chkMonthVisible", false);
				oViewModel.setProperty("/chkDayEditable", false);
				oViewModel.setProperty("/chkWeekEditable", true);
				oViewModel.setProperty("/chkMonthEditable", false);
			}
			if (oObject.TRIGGER_PERIODICITY === "M") {
				oViewModel.setProperty("/chkDayVisible", false);
				oViewModel.setProperty("/chkWeekVisible", false);
				oViewModel.setProperty("/chkMonthVisible", true);
				oViewModel.setProperty("/chkDayEditable", false);
				oViewModel.setProperty("/chkWeekEditable", false);
				oViewModel.setProperty("/chkMonthEditable", true);
			}
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onDayly : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/chkDayVisible", true);
			oViewModel.setProperty("/chkWeekVisible", false);
			oViewModel.setProperty("/chkMonthVisible", false);

			oViewModel.setProperty("/chkWSat", false);
			oViewModel.setProperty("/chkWSun", false);
			oViewModel.setProperty("/chkWMon", false);
			oViewModel.setProperty("/chkWTue", false);
			oViewModel.setProperty("/chkWWed", false);
			oViewModel.setProperty("/chkWThu", false);
			oViewModel.setProperty("/chkWFri", false);
			this.getView().byId("inDayMonth").setValue("");
			oViewModel.setProperty("/chkMonthEditable", false);
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onWeekly : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/chkDayVisible", false);
			oViewModel.setProperty("/chkWeekVisible", true);
			oViewModel.setProperty("/chkMonthVisible", false);

			oViewModel.setProperty("/chkDSat", false);
			oViewModel.setProperty("/chkDSun", false);
			oViewModel.setProperty("/chkDHol", false);
			this.getView().byId("inDayMonth").setValue("");
			oViewModel.setProperty("/chkMonthEditable", false);
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onMonthly : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/chkDayVisible", false);
			oViewModel.setProperty("/chkWeekVisible", false);
			oViewModel.setProperty("/chkMonthVisible", true);
			oViewModel.setProperty("/chkDSat", false);
			oViewModel.setProperty("/chkDSun", false);
			oViewModel.setProperty("/chkDHol", false);
			oViewModel.setProperty("/chkWSat", false);
			oViewModel.setProperty("/chkWSun", false);
			oViewModel.setProperty("/chkWMon", false);
			oViewModel.setProperty("/chkWTue", false);
			oViewModel.setProperty("/chkWWed", false);
			oViewModel.setProperty("/chkWThu", false);
			oViewModel.setProperty("/chkWFri", false);
			oViewModel.setProperty("/chkMonthEditable", true);
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onAuto : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/autoVisible", true);
			oViewModel.setProperty("/expertVisible", false);
			this.getView().byId("inProcedure").setValue("");
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onExpert : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/autoVisible", false);
			oViewModel.setProperty("/expertVisible", true);
			this.getView().byId("inSQL").setValue("");
			
			var isNew = oViewModel.getProperty("/isNew");
			if (isNew === false) {
				this.getView().byId("inEKey").setVisible(true);
				this.getView().byId("inEResult").setVisible(true);
			} else {	
				this.getView().byId("inEKey").setVisible(false);
				this.getView().byId("inEResult").setVisible(false);
			}			
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onCancelar : function() {

			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", false);

			// Reseta o model para o inicial
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", false);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);

			this.getView().unbindElement();
			this.onNavBack();
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onGravar : function() {
			// Salva o registro
			var oView = this.getView();
			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");
			var oObject = oView.getBindingContext().getObject();
			var model = {};
			that = this;
			var flag = 0;

//			var perDay = oViewModel.getProperty("/rbDay");
//			if (perDay) {
//				if (oViewModel.getProperty("/chkDSat") === false && oViewModel.getProperty("/chkDSun") === false && oViewModel.getProperty("/chkDHol") === false) {
//					flag = 1;
//					jQuery.sap.require("sap.m.MessageToast");
//					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgDay"), {
//						of : this.getView().byId("rbDay")
//					});
//				}
//			}

			var perWeek = oViewModel.getProperty("/rbWeek");
			if (perWeek) {
				if (oViewModel.getProperty("/chkWSat") === false && oViewModel.getProperty("/chkWSun") === false && oViewModel.getProperty("/chkWMon") === false && oViewModel.getProperty("/chkWTue") === false && oViewModel.getProperty("/chkWWed") === false
						&& oViewModel.getProperty("/chkWThu") === false && oViewModel.getProperty("/chkWFri") === false) {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgWeek"), {
						of : this.getView().byId("rbWeek")
					});
					return;
				}
			}

			var perMonth = oViewModel.getProperty("/rbMonth");
			if (perMonth) {
				if (this.getView().byId("inDayMonth").getSeletedKey() === "") {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgMonth"), {
						of : this.getView().byId("rbMonth")
					});
					return;
				}
			}

			if (this.getView().byId("inName").getValue() === "") {
				flag = 1;
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgName"), {
					of : this.getView().byId("inName")
				});
				return;
			}

			if (this.getView().byId("dtValidFrom").getValue() === "") {
				flag = 1;
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgdtValidFrom"), {
					of : this.getView().byId("dtValidFrom")
				});
				return;
			}

			if (this.getView().byId("dtValidTo").getValue() === "") {
				flag = 1;
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgdtValidTo"), {
					of : this.getView().byId("dtValidTo")
				});
				return;
			}
			var valPadrao1 = oViewModel.getProperty("/valPadrao1");
			if (this.getView().byId("inAbrang").getValue() === "" || valPadrao1) {
				flag = 1;
				jQuery.sap.require("sap.m.MessageToast");
				sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msginAbrang"), {
					of : this.getView().byId("inAbrang")
				});
				return;
			}

			if (oViewModel.getProperty("/rbauto") === true) {
				var valPadrao2 = oViewModel.getProperty("/valPadrao2");				
				if (this.getView().byId("inSQL").getValue() === "" || valPadrao2) {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msginSQL"), {
						of : this.getView().byId("inSQL")
					});
					return;
				}

				if (this.getView().byId("inAKey").getValue() === "") {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgKey"), {
						of : this.getView().byId("inAKey")
					});
					return;
				}
				
				if (this.getView().byId("inAResult").getValue() === "") {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgResult"), {
						of : this.getView().byId("inAResult")
					});
					return;
				}
			}

			if (oViewModel.getProperty("/rbexper") === true) {

				var oProcTokens = this.byId("inProcedure").getTokens();
				if (oProcTokens.length === 0) {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgProcedure"), {
						of : this.getView().byId("inProcedure")
					});
					return;
				}

				var oEKeyTokens = this.byId("inEKey").getTokens();
				if (oEKeyTokens.length === 0) {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgKey"), {
						of : this.getView().byId("inEKey")
					});
					return;
				}
				
				var oEResultTokens = this.byId("inEResult").getTokens();
				if (oEResultTokens.length === 0) {
					flag = 1;
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("msgResult"), {
						of : this.getView().byId("inEResult")
					});
					return;
				}
			}

			if (flag === 0) {
				var isNew = oViewModel.getProperty("/isNew");
				if (isNew) {

					var genId = oModel.read("/genPredictiveModelId", {
						success : function(oResponseSucess) {

							model.PREDICTIVE_MODEL_ID = oResponseSucess.results[0].GEN_PREDICTIVE_MODEL_ID;
							that.fillModelPreditivoFromScreen(that, model);
							// Salva o registro
							oModel.create("/modeloPreditivoOData", model, {
								async : false,
								success : function(oData, response) {
									oModel.refresh();
									oViewModel.setProperty("/busy", false);
									// Volta para a tela inicial
									that.onNavBack();

								},
								error : function(oResponseError) {
									var xmlDoc = jQuery.parseXML(oResponseError.responseText);
									debugger;
									var txtErro = xmlDoc.getElementsByTagName("message")[0].childNodes[0].data;
									sap.m.MessageBox.error(txtErro, {
										id : "serviceErrorMessageBox",
										details : "\n########## model\n" + JSON.stringify(model),
										actions : [ sap.m.MessageBox.Action.CLOSE ],
										onClose : function() {
											oViewModel.setProperty("/busy", false);
										}.bind(this)
									});
								}
							});
						},
						error : function(oError) {
						}
					});

				} else {

					model.PREDICTIVE_MODEL_ID = this.byId("inIDModelo").getValue();
					this.fillModelPreditivoFromScreen(that, model);
					// Atualiza registro sem alterar campos chaves
					oModel.update("/modeloPreditivoOData(PREDICTIVE_MODEL_ID=" + model.PREDICTIVE_MODEL_ID + ")", model, {
						async : false,
						merge : false,
						success : function(oData, response) {
							sap.m.MessageToast.show("Update Realizado");
							oModel.refresh();
							oViewModel.setProperty("/busy", false);
							that.onNavBack();
						},
						error : function(oResponseError) {
							var xmlDoc = jQuery.parseXML(oResponseError.responseText);
							debugger;
							var txtErro = xmlDoc.getElementsByTagName("message")[0].childNodes[0].data;
							sap.m.MessageBox.error(txtErro, {
								id : "serviceErrorMessageBox",
								details : "\n########## model\n" + JSON.stringify(model),
								actions : [ sap.m.MessageBox.Action.CLOSE ],
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
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onDeletar : function() {
			var oView = this.getView();
			var oComponent = this.getOwnerComponent();
			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");
			var that = this;
			var model = {};

			model.PREDICTIVE_MODEL_ID = this.byId("inIDModelo").getValue();
			model.VALID_FROM = new Date(this.byId("dtValidFrom").getValue());

			var oComponent = this.getOwnerComponent();

			sap.m.MessageBox.confirm("Confirmar exclusão ?", {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// Apagar registro
						oModel.remove("/modeloPreditivoOData(PREDICTIVE_MODEL_ID=" + model.PREDICTIVE_MODEL_ID + ")", {
							async : false,
							merge : false,
							success : function(oData, response) {
								sap.m.MessageToast.show("Delete Realizado");
								// oModel.refresh();
								oViewModel.setProperty("/busy", true);
								that.onNavBack();
							},
							error : function(oResponseError) {
								var xmlDoc = jQuery.parseXML(oResponseError.responseText);
								debugger;
								var txtErro = xmlDoc.getElementsByTagName("message")[0].childNodes[0].data;
								sap.m.MessageBox.error(txtErro, {
									id : "serviceErrorMessageBox",
									details : "\n########## model\n" + JSON.stringify(model),
									actions : [ sap.m.MessageBox.Action.CLOSE ],
									onClose : function() {
										oViewModel.setProperty("/busy", false);
									}.bind(this)
								});
							}
						});
					}
				}
			});

		},
		/**
		 * fill the json model with data from screen
		 * 
		 * @function
		 * @param jsonObject
		 * @private
		 */
		fillModelPreditivoFromScreen : function(that, model) {
			var oView = this.getView();
			var oViewModel = this.getModel("objectView");

			model.NAME = this.byId("inName").getValue();

			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern : "dd/MM/yyyy HH:mm:ss"
			});

			var strDataDesde = dateFormat.parse(this.byId("dtValidFrom").getValue());
			model.VALID_FROM = new Date(strDataDesde);

			var strDataAte = dateFormat.parse(this.byId("dtValidTo").getValue());
			model.VALID_UNTIL = new Date(strDataAte);

			model.PREDICTIVE_MODEL_SUBJECT_ID = this.byId("comboTipoModel").getSelectedKey();
			model.DESCRIPTION = this.byId("inDesc").getValue();
			// SIR - Thiago César Santos - 12/05/2017 - Início			
//			model.SQL_MODEL = this.byId("inAbrang").getValue();
			model.SQL_VIEW = this.byId("inAbrang").getValue();
			// SIR - Thiago César Santos - 12/05/2017 - Fim
			// Automático
			if (oViewModel.getProperty("/rbauto") === true) {

				model.TYPE_MODEL = 1;
				// SIR - Thiago César Santos - 12/05/2017 - Início				
//				model.SQL_VIEW = this.byId("inSQL").getValue();
				model.SQL_MODEL = this.byId("inSQL").getValue();
				// SIR - Thiago César Santos - 12/05/2017 - Fim	
				model.FIELD_KEY = this.byId("inAKey").getValue();
				
			
//				var oAKeyTokens = this.byId("inAKey").getTokens();
//				for (var i = 0; i < oAKeyTokens.length; i++) {
//					model.FIELD_KEY = oAKeyTokens[i].getText();
//				}
				model.FIELD_RESULT = this.byId("inAResult").getValue();
//				var oAResultTokens = this.byId("inAResult").getTokens();
//				for (var i = 0; i < oAResultTokens.length; i++) {
//					model.FIELD_RESULT = oAResultTokens[i].getText();
//				}
			}
			// Expert
			if (oViewModel.getProperty("/rbexper") === true) {

				model.TYPE_MODEL = 2;
				model.SQL_VIEW = "blank";
				// Procedure
				var oProcTokens = this.byId("inProcedure").getTokens();
				for (var i = 0; i < oProcTokens.length; i++) {
					model.PROCEDURE_MODEL = oProcTokens[i].getText();
				}

				var oEKeyTokens = this.byId("inEKey").getTokens();
				for (var i = 0; i < oEKeyTokens.length; i++) {
					model.FIELD_KEY = oEKeyTokens[i].getText();
				}

				var oEResultTokens = this.byId("inEResult").getTokens();
				for (var i = 0; i < oEResultTokens.length; i++) {
					model.FIELD_RESULT = oEResultTokens[i].getText();
				}
			}
			//    	
			if (oViewModel.getProperty("/rbDay") === true) {
				model.TRIGGER_NAME = "Diária";
				model.TRIGGER_PERIODICITY = "D";
				model.TRIGGER_MON = 0;
				model.TRIGGER_TUE = 0;
				model.TRIGGER_WED = 0;
				model.TRIGGER_THU = 0;
				model.TRIGGER_FRI = 0;
				model.TRIGGER_SAT = 0;
				model.TRIGGER_SUN = 0;
				model.TRIGGER_HOLIDAY = 0;
				if (oViewModel.getProperty("/chkDSat")) {
					model.TRIGGER_SAT = 1;
				}
				if (oViewModel.getProperty("/chkDSun")) {
					model.TRIGGER_SUN = 1;
				}
				if (oViewModel.getProperty("/chkDHol")) {
					model.TRIGGER_HOLIDAY = 1;
				}
				model.TRIGGER_DAY_MONTH = null;
			}
			//
			if (oViewModel.getProperty("/rbWeek")) {
				model.TRIGGER_NAME = "Semanal";
				model.TRIGGER_PERIODICITY = "S";
				model.TRIGGER_MON = 0;
				model.TRIGGER_TUE = 0;
				model.TRIGGER_WED = 0;
				model.TRIGGER_THU = 0;
				model.TRIGGER_FRI = 0;
				model.TRIGGER_SAT = 0;
				model.TRIGGER_SUN = 0;
				model.TRIGGER_HOLIDAY = 0;
				if (oViewModel.getProperty("/chkWMon")) {
					model.TRIGGER_MON = 1;
				}
				if (oViewModel.getProperty("/chkWTue")) {
					model.TRIGGER_TUE = 1;
				}
				if (oViewModel.getProperty("/chkWWed")) {
					model.TRIGGER_WED = 1;
				}
				if (oViewModel.getProperty("/chkWThu")) {
					model.TRIGGER_THU = 1;
				}
				if (oViewModel.getProperty("/chkWFri")) {
					model.TRIGGER_FRI = 1;
				}
				if (oViewModel.getProperty("/chkWSat")) {
					model.TRIGGER_SAT = 1;
				}
				if (oViewModel.getProperty("/chkWSun")) {
					model.TRIGGER_SUN = 1;
				}
				model.TRIGGER_DAY_MONTH = null;
			}
			//
			if (oViewModel.getProperty("/rbMonth")) {
				model.TRIGGER_NAME = "Mensal";
				model.TRIGGER_PERIODICITY = "M";
				model.TRIGGER_MON = 0;
				model.TRIGGER_TUE = 0;
				model.TRIGGER_WED = 0;
				model.TRIGGER_THU = 0;
				model.TRIGGER_FRI = 0;
				model.TRIGGER_SAT = 0;
				model.TRIGGER_SUN = 0;

				model.TRIGGER_DAY_MONTH = this.byId("inDayMonth").getSelectedKey();
				model.TRIGGER_HOLIDAY = 0;
			}

			console.log("ModeloPreditivo::::\n" + JSON.stringify(model));
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onF4Procedure : function(oEvent) {
			// This code was generated by the layout editor.
			var oInputProcedure = this.getView().byId("inProcedure");
			var oModel = this.getModel();
			var that = this;
//			oInputProcedure.destroyTokens();
			var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				title : this.getView().getModel("i18n").getResourceBundle().getText("procedure"),
				supportMultiselect : false,
				key : "SCHEMA_NAME",
				descriptionKey : "PROCEDURE_NAME",
				ok : function(oControlEvent) {
					oInputProcedure.destroyTokens();
					var aTokens = oControlEvent.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						var array = (token.getText()).split(" ");
						token.setText(token.getKey() + "@" + array[0]);
						oInputProcedure.addToken(token);
					}
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
					label : that.getView().getModel("i18n").getResourceBundle().getText("schema"),
					template : "SCHEMA_NAME"
				}, {
					label : that.getView().getModel("i18n").getResourceBundle().getText("procedure"),
					template : "PROCEDURE_NAME"
				} ]
			});

//			oValueHelpDialog.getTable().setModel(oColModel, "columns");
//			oValueHelpDialog.getTable().setModel(this.getModel());
//			oValueHelpDialog.getTable().bindRows("/atributosProcedureOData");
//			oValueHelpDialog.addStyleClass("sapUiSizeCozy");
//			oValueHelpDialog.open();
//			oValueHelpDialog.update();
//			var oTable = oValueHelpDialog.getTable();
//			oTable.setModel(oColModel, "columns");			
			oModel.read("/proceduresModelOData", {
				// filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];
					debugger;
					var sTable = [];
					var esquema;
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var sort = {};
						sort.SCHEMA_NAME = oResponseSucess.results[i].SCHEMA_NAME;
						sort.PROCEDURE_NAME = oResponseSucess.results[i].PROCEDURE_NAME;

						sTable.push(sort);
					}
//					var newArray = that.removeDuplicates(sTable, "SCHEMA_NAME");
					
					var sortedTable = sTable.sort(function(a, b) {
						var nameA = a.PROCEDURE_NAME.toLowerCase(), nameB = b.PROCEDURE_NAME.toLowerCase();
						if (nameA < nameB) // sort string ascending
							return -1;
						if (nameA > nameB)
							return 1;
						return 0; // default return value (no sorting)
					});


//					debugger;
//					var sortT = new Array.from(sortedTable.reduce((m, t) => m.set(t.place, t), new Map()).values());					
					var oTable = oValueHelpDialog.getTable();
					oTable.setModel(oColModel, "columns");

					var oRowsModel = new sap.ui.model.json.JSONModel();
					oRowsModel.setData(sortedTable);
					oTable.setModel(oRowsModel);
					if (oTable.bindRows) {
						oTable.bindRows("/");
					}

					oValueHelpDialog.addStyleClass("sapUiSizeCozy");
					oValueHelpDialog.open();
					oValueHelpDialog.update();

				},
				error : function(oResponseSucess) {

				}

			});			
		},
		removeDuplicates : function (originalArray, prop) {
		     var newArray = [];
		     var lookupObject  = {};

		     for(var i in originalArray) {
		        lookupObject[originalArray[i][prop]] = originalArray[i];
		     }

		     for(i in lookupObject) {
		         newArray.push(lookupObject[i]);
		     }
		      return newArray;
		 },		
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onF4ProcKey : function(oEvent) {
			// This code was generated by the layout editor.
			var oInputEKey = this.getView().byId("inEKey");
//			oInputEKey.destroyTokens();
			var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				title : this.getView().getModel("i18n").getResourceBundle().getText("field_key"),
				supportMultiselect : false,
				// key : "COLUMN_NAME",
				descriptionKey : "COLUMN_NAME",
				ok : function(oControlEvent) {
					oInputEKey.destroyTokens();
					var aTokens = oControlEvent.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						oInputEKey.addToken(aTokens[i]);
					}
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
					label : this.getView().getModel("i18n").getResourceBundle().getText("field_key"),
					template : "COLUMN_NAME"
				} ]
			});

			oValueHelpDialog.getTable().setModel(oColModel, "columns");
			debugger;
			var sortedTable = [];
			for (var i = 0; i < this.eArrayKey.length; i++) {
				sortedTable.push(this.eArrayKey[i].COLUMN_NAME);
			}

			debugger;
			sortedTable.sort();
			var item;
			var itemList = [];
			for (var i = 0; i < sortedTable.length; i++) {
				if (i === 0) {
					item = sortedTable[i];
					itemList.push(sortedTable[i]);
				} else {
					if (item !== sortedTable[i]) {
						item = sortedTable[i];
						itemList.push(sortedTable[i]);
					}
				}
			}

			var itemListSorted = [];
			for (var i = 0; i < itemList.length; i++) {
				var itemsSorted = [];
				itemsSorted.COLUMN_NAME = itemList[i];
				itemListSorted.push(itemsSorted);
			}
			
			var oRowsModel = new sap.ui.model.json.JSONModel();
			oRowsModel.setData(itemListSorted);
			oValueHelpDialog.getTable().setModel(oRowsModel);
			if (oValueHelpDialog.getTable().bindRows) {
				oValueHelpDialog.getTable().bindRows("/");
			}
			oValueHelpDialog.addStyleClass("sapUiSizeCozy");
			oValueHelpDialog.open();
			oValueHelpDialog.update();
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onF4ProcResult : function(oEvent) {
			// This code was generated by the layout editor.
			var oInputEKey = this.getView().byId("inEResult");
//			oInputEKey.destroyTokens();
			var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				title : this.getView().getModel("i18n").getResourceBundle().getText("field_result"),
				supportMultiselect : false,
				// key : "COLUMN_NAME",
				descriptionKey : "COLUMN_NAME",
				ok : function(oControlEvent) {
					oInputEKey.destroyTokens();
					var aTokens = oControlEvent.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						oInputEKey.addToken(aTokens[i]);
					}
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
					label : this.getView().getModel("i18n").getResourceBundle().getText("field_result"),
					template : "COLUMN_NAME"
				} ]
			});

			oValueHelpDialog.getTable().setModel(oColModel, "columns");
			debugger;
			var sortedTable = [];
			for (var i = 0; i < this.eArrayKey.length; i++) {
				sortedTable.push(this.eArrayKey[i].COLUMN_NAME);
			}

			debugger;
			sortedTable.sort();
			var item;
			var itemList = [];
			for (var i = 0; i < sortedTable.length; i++) {
				if (i === 0) {
					item = sortedTable[i];
					itemList.push(sortedTable[i]);
				} else {
					if (item !== sortedTable[i]) {
						item = sortedTable[i];
						itemList.push(sortedTable[i]);
					}
				}
			}

			var itemListSorted = [];
			for (var i = 0; i < itemList.length; i++) {
				var itemsSorted = [];
				itemsSorted.COLUMN_NAME = itemList[i];
				itemListSorted.push(itemsSorted);
			}
			
			var oRowsModel = new sap.ui.model.json.JSONModel();
			oRowsModel.setData(itemListSorted);
			oValueHelpDialog.getTable().setModel(oRowsModel);
			if (oValueHelpDialog.getTable().bindRows) {
				oValueHelpDialog.getTable().bindRows("/");
			}
			oValueHelpDialog.addStyleClass("sapUiSizeCozy");
			oValueHelpDialog.open();
			oValueHelpDialog.update();
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onF4fieldkey : function(oEvent) {
			// This code was generated by the
			// layout editor.
			var oInputFieldkey = this.getView().byId("inAKey");
//			oInputFieldkey.destroyTokens();
			var oKeyValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idFieldKey", {
				basicSearchText : oInputFieldkey.getValue(),
				title : this.getView().getModel("i18n").getResourceBundle().getText("fieldkey"),
				supportMultiselect : false,
				// key : "COLUMN_NAME",
				descriptionKey : "COLUMN_NAME",
				ok : function(oControlEvent) {
					var aTokens = oControlEvent.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						oInputFieldkey.addToken(aTokens[i]);
					}
					oKeyValueHelpDialog.close();
				},

				cancel : function(oControlEvent) {
					oKeyValueHelpDialog.close();
				},

				afterClose : function() {
					oKeyValueHelpDialog.destroy();
				}
			});

			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols : [ {
					label : this.getView().getModel("i18n").getResourceBundle().getText("campo"),
					template : "COLUMN_NAME"
				}, {
					label : this.getView().getModel("i18n").getResourceBundle().getText("descricao"),
					template : "COMMENTS"
				} ]
			});

			oKeyValueHelpDialog.getTable().setModel(oColModel, "columns");

			oKeyValueHelpDialog.getTable().setModel(this.getModel());
			oKeyValueHelpDialog.getTable().bindRows("/atributoFiltrosPoliticosOData");
			oKeyValueHelpDialog.addStyleClass("sapUiSizeCozy");
			oKeyValueHelpDialog.open();
			oKeyValueHelpDialog.update();

		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onF4fieldresult : function(oEvent) {
			// This code was generated by the
			// layout editor.
			var oInputFieldResult = this.getView().byId("inAResult");
			oInputFieldResult.destroyTokens();
			var oResultValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idFieldResult", {
				basicSearchText : oInputFieldResult.getValue(),
				title : this.getView().getModel("i18n").getResourceBundle().getText("fieldresult"),
				supportMultiselect : false,
				// key : "COLUMN_NAME",
				descriptionKey : "COLUMN_NAME",
				ok : function(oControlEvent) {
					var aTokens = oControlEvent.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						oInputFieldResult.addToken(aTokens[i]);
					}
					oResultValueHelpDialog.close();
				},

				cancel : function(oControlEvent) {
					oResultValueHelpDialog.close();
				},

				afterClose : function() {
					oResultValueHelpDialog.destroy();
				}
			});

			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols : [ {
					label : this.getView().getModel("i18n").getResourceBundle().getText("campo"),
					template : "COLUMN_NAME"
				}, {
					label : this.getView().getModel("i18n").getResourceBundle().getText("descricao"),
					template : "COMMENTS"
				} ]
			});

			oResultValueHelpDialog.getTable().setModel(oColModel, "columns");
			oResultValueHelpDialog.getTable().setModel(this.getModel());
			oResultValueHelpDialog.getTable().bindRows("/atributoFiltrosPoliticosOData");
			oResultValueHelpDialog.addStyleClass("sapUiSizeCozy");
			oResultValueHelpDialog.open();
			oResultValueHelpDialog.update();

		},
//		onLoadTest : function(){
//			sap.ui.commons.MessageBox.alert("Carregar somente arquivos com extensão .txt  ou .sql");			
//		},		
		/**f
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onLoadFileCond : function(oEvent) {
			// This code was generated by the
			// layout editor.
			debugger;''
			var oViewModel = this.getModel("objectView");
			var file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
			var name = file.name;
			if(!name.includes(".txt") && !name.includes(".TXT")){
				sap.ui.commons.MessageBox.alert("Carregar somente arquivos com extensão .txt");
				return;
			}
			debugger;		
			var reader = new FileReader();
			that = this;
			reader.onload = function(evn) {
				debugger;
				var strTXT = evn.target.result;
				that.getView().byId("inAbrang").setValue(strTXT);
				oViewModel.setProperty("/valPadrao1", false);

			};
			reader.readAsText(file);
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onLoadFileSQL : function(oEvent) {
			// This code was generated by the
			// layout editor.
			var oViewModel = this.getModel("objectView");
			var file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
//			sap.ui.commons.MessageBox.alert("Carregar somente arquivos com extensão .txt  ou .sql");
			var name = file.name;
			if(!name.includes(".txt") && !name.includes(".TXT")){
				sap.ui.commons.MessageBox.alert("Carregar somente arquivos com extensão .txt");
				return;
			}			
			debugger;
			var reader = new FileReader();
			reader.onload = function(evn) {
				debugger;
				var strTXT = evn.target.result;
				that.getView().byId("inSQL").setValue(strTXT);
				oViewModel.setProperty("/valPadrao2", false);				
			};
			reader.readAsText(file);
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onVerify : function() {

			var oModel = this.getModel();
			var that = this;
			var procedure;
			var oProcTokens = this.byId("inProcedure").getTokens();
			for (var i = 0; i < oProcTokens.length; i++) {
				var token = oProcTokens[i];
				procedure = token.getText();
			}
			this.eArrayKey = [];
			var array = procedure.split("@");
			var filters = new Array();
			var filterByName = new sap.ui.model.Filter("SCHEMA_NAME", sap.ui.model.FilterOperator.EQ, array[0]);
			filters.push(filterByName);

			filterByName = new sap.ui.model.Filter("PROCEDURE_NAME", sap.ui.model.FilterOperator.EQ, array[1]);
			filters.push(filterByName);

			oModel.read("/atributosProcedureOData", {
				filters : filters,
				success : function(oResponseSucess) {
					debugger;
					if (oResponseSucess.results.length > 0) {
						for (var i = 0; i < oResponseSucess.results.length; i++) {
							var item = oResponseSucess.results[i];
							that.eArrayKey.push(item);
						}
						that.getView().byId("inEKey").setVisible(true);
						that.getView().byId("inEResult").setVisible(true);
					} else {
						sap.m.MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("noDataText"));
						that.getView().byId("inEKey").setVisible(false);
						that.getView().byId("inEResult").setVisible(false);
					}
				},
				error : function(oResponseError) {
					sap.m.MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("noDataText"));
				}
			});
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object Clear fields on Screen
		 */
		onClearFields : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/rbauto", true);
			oViewModel.setProperty("/chkDayVisible", true);
			oViewModel.setProperty("/chkWeekVisible", false);
			oViewModel.setProperty("/chkMonthVisible", false);
			oViewModel.setProperty("/rbDay", true);
			oViewModel.setProperty("/rbWeek", false);
			oViewModel.setProperty("/rbMonth", false);
			oViewModel.setProperty("/chkDSat", false);
			oViewModel.setProperty("/chkDSun", false);
			oViewModel.setProperty("/chkDHol", false);
			oViewModel.setProperty("/chkWSat", false);
			oViewModel.setProperty("/chkWSun", false);
			oViewModel.setProperty("/chkWMon", false);
			oViewModel.setProperty("/chkWTue", false);
			oViewModel.setProperty("/chkWWed", false);
			oViewModel.setProperty("/chkWThu", false);
			oViewModel.setProperty("/chkWFri", false);
			oViewModel.setProperty("/valPadrao1", false);
			oViewModel.setProperty("/valPadrao1", false);			
			that.byId("inName").setValue("");
			this.getView().byId("comboTipoModel").setSelectedKey("");
			this.getView().byId("dtValidFrom").setValue("");
			this.getView().byId("dtValidTo").setValue("");
			this.getView().byId("inDesc").setValue("");
			this.getView().byId("inDayMonth").setSelectedKey("");
			this.getView().byId("inAbrang").setValue("");
			this.getView().byId("inSQL").setValue("");
			//that.getView().byId("inAKey").destroyTokens();
			this.getView().byId("inAKey").setValue("");			
			//that.getView().byId("inAResult").destroyTokens();
			this.getView().byId("inAResult").setValue("");
			that.getView().byId("inProcedure").destroyTokens();
			that.getView().byId("inEKey").destroyTokens();
			that.getView().byId("inEResult").destroyTokens();
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object Call new screen for add
		 *           type models
		 */
		onNewTypeModel : function() {
			window.open("/accs/ui5/tipoModelo/webapp/index.html", "_blank");
		},
		/**
		 * @memberOf com.cpfl.modelos.controller.Object
		 */
		onRefreshList : function() {
			// This code was generated by the layout editor.
			var oModel = this.getModel();
			oModel.refresh("/tipoModeloPreditivoOData");
		}
	});
});