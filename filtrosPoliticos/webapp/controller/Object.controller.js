sap.ui.define([ "com/cpfl/filtrospoliticos/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "sap/ushell/services/Container", "sap/m/MessageBox", "sap/m/MessageToast", "com/cpfl/filtrospoliticos/model/formatter" ], function(BaseController, JSONModel, History,
		Container, MessageBox, MessageToast, formatter) {
	"use strict";
	var that;
	return BaseController.extend("com.cpfl.filtrospoliticos.controller.Object", {

		formatter : formatter,

		/* =========================================================== */
		/* lifecycle methods */
		/* =========================================================== */

		onInit : function() {

			that = this;

			var iOriginalBusyDelay, oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				btProcessarVisible : false,
				btSalvarVisible : false,
				btPreviewVisible : false,
				btApagarVisible : false,
				btCancelarVisible : false,
				formEditable : false,
				isNew : false,
				igual : "=",
				diferente : "!=",
				maior : ">",
				maiorigual : ">=",
				menor : "<",
				menorigual : "<=",
				asc : "ASC",
				des : "DESC"
			});

			this.layout = [];
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
		 * Event handler for navigating back. It there is a history entry or an
		 * previous app-to-app navigation we go one step back in the browser
		 * history If not, it will replace the current entry of the browser
		 * history with the worklist route.
		 * 
		 * @public
		 */
		onNavBack : function() {
			// var sPreviousHash = History.getInstance().getPreviousHash(),
			// oCrossAppNavigator =
			// Container.getService("CrossApplicationNavigation");
			//
			// if (sPreviousHash !== undefined ||
			// !oCrossAppNavigator.isInitialNavigation()) {
			// history.go(-1);
			// } else {
			// this.getRouter().navTo("worklist", {}, true);
			// }
			// this.onClearFields();

			this.layout = [ false, false, false, false, false, false, false ];
			this.onSetLayout(this.layout);
			this.onClearFields();
			this.getView().unbindElement();
			this.getRouter().navTo("worklist", {}, true);
		},

		onClearFields : function() {
			this.getView().byId("inAcao").destroyTokens();
			// this.getView().byId("comboAcao").setSelectedKey(" ");
			this.getView().byId("comboEmpresa").setSelectedKey(" ");
			this.getView().byId("comboEmpresa").setValue(" ");
			this.getView().byId("dtValidFrom").setValue(" ");
			this.getView().byId("dtValidTo").setValue(" ");
			// this.getView().byId("comboFAtributo").setSelectedKey(" ");
			this.getView().byId("inFAtributo").destroyTokens();
			this.getView().byId("comboFOper").setSelectedKey(" ");
			this.getView().byId("comboFOper").setValue(" ");
			this.getView().byId("inFValor").setValue(" ");
			// this.getView().byId("inQtdReg").setValue(" ");
			this.getView().byId("inAFiltro").setValue(" ");
			// this.getView().byId("comboOAtributo").setSelectedKey(" ");
			this.getView().byId("inOAtributo").destroyTokens();
			this.getView().byId("comboOOper").setSelectedKey(" ");
			this.getView().byId("comboOOper").setValue(" ");
			this.getView().byId("inDayslastExec").setValue(" ");
			this.getView().byId("inAOrder").setValue(" ");
			// this.getView().byId("comboParticionamento").setSelectedKey(" ");
			this.getView().byId("inParticionamento").destroyTokens();
			this.getView().byId("inAPart").setValue(" ");
			// this.getView().byId("comboROrder").setSelectedKey(" ");
			this.getView().byId("inOrder").destroyTokens();
			this.getView().byId("comboType").setSelectedKey(" ");
			this.getView().byId("comboType").setValue(" ");
			this.getView().byId("inLimite").setValue(" ");
			this.getView().byId("inAROrder").setValue(" ");
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
			var that = this;
			var oView = this.getView();
			var oModel = this.getModel();
			var sObjectId = oEvent.getParameter("arguments").objectId

			if (sObjectId === "Create") {

				oViewModel.setProperty("/title", this.getView().getModel("i18n").getResourceBundle().getText("createFiltro"));
				this.onClearFields();
				this.getModel().metadataLoaded().then(function() {
					var oEntry = oView.getModel().createEntry("filtroPoliticoOData");
					oView.setBindingContext(oEntry);
					this.onCreateLayout();
				}.bind(this));

				oViewModel.setProperty("/busy", false);

			} else {
				this.aItemsAcao = [];
				oViewModel.setProperty("/title", this.getView().getModel("i18n").getResourceBundle().getText("displayFiltro"));
				var array = sObjectId.split("#");
				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("filtroPoliticoOData", {
						ACTION_ID : array[0],
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
			this.onDisplayLayout();
			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.ACTION_ID, sObjectName = oObject.ACTION_ID;
			var isNew = oViewModel.getProperty("/isNew");
			if (isNew === false) {
				this.getView().byId("inAcao").destroyTokens();
				var oToken = new sap.m.Token();
				if (oObject.ACTION_ID) {
					oToken.setKey(oObject.ACTION_ID);
					oToken.setText(oObject.ACTION_NAME);
					this.getView().byId("inAcao").addToken(oToken);
				}
			}
			// Everything went fine.
			oViewModel.setProperty("/busy", false);
		},

		onSetLayout : function(layout) {
			var oViewModel = this.getModel("objectView");
			for (var i = 0; i < layout.length; i++) {
				switch (i) {
				case 0:
					oViewModel.setProperty("/isNew", layout[i]);
				case 1:
					oViewModel.setProperty("/btProcessarVisible", layout[i]);
				case 2:
					oViewModel.setProperty("/btSalvarVisible", layout[i]);
				case 3:
					oViewModel.setProperty("/btPreviewVisible", layout[i]);
				case 4:
					oViewModel.setProperty("/btApagarVisible", layout[i]);
				case 5:
					oViewModel.setProperty("/btCancelarVisible", layout[i]);
				case 6:
					oViewModel.setProperty("/formEditable", layout[i]);
				}
			}
			layout = [];
		},

		onCancelar : function() {
			this.onNavBack();
		},

		onDisplayLayout : function() {
			this.layout = [ false, true, false, true, false, false, false ];
			this.onSetLayout(this.layout);

			// this.getView().byId("comboAcao").setEditable(false);
			this.getView().byId("inAcao").setEditable(false);
			this.getView().byId("comboEmpresa").setEditable(false);

		},

		onCreateLayout : function() {
			// Setar Datas
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth() + 1;
			var yyyy = today.getFullYear();
			var hh = today.getHours();
			var MM = today.getMinutes();
			var ss = today.getSeconds();

			if (dd < 10) {
				dd = '0' + dd
			}
			if (mm < 10) {
				mm = '0' + mm
			}
			if (hh < 10) {
				hh = '0' + hh
			}
			if (MM < 10) {
				MM = '0' + MM
			}

			today = dd + "/" + mm + "/" + yyyy + " " + hh + ":" + MM + ":" + ss;

			this.getView().byId("dtValidFrom").setValue(today);
			this.getView().byId("dtValidTo").setValue("31129999");

			this.layout = [ true, false, true, false, false, false, true ];
			this.onSetLayout(this.layout);

			// this.getView().byId("comboAcao").setEditable(true);
			this.getView().byId("inAcao").setEditable(true);
			this.getView().byId("comboEmpresa").setEditable(true);
		},

		onProcessar : function() {
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/title", this.getView().getModel("i18n").getResourceBundle().getText("changeFiltro"));

			this.layout = [ false, false, true, true, true, true, true ];
			this.onSetLayout(this.layout);

			// this.getView().byId("comboAcao").setEditable(false);
			this.getView().byId("inAcao").setEditable(false);
			this.getView().byId("comboEmpresa").setEditable(false);
		},

		onPreview : function(oEvent) {
			this._previewObject(oEvent.getSource());
		},

		_previewObject : function(oItem) {
			var ACTION_ID = oItem.getBindingContext().getProperty("ACTION_ID");
			var VALID_FROM = oItem.getBindingContext().getProperty("VALID_FROM");
			var key = ACTION_ID + "#" + VALID_FROM;

			this.getRouter().navTo("preview", {
				objectId : key
			});
		},

		// Botões do Filtro
		onAND : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + "AND" + " ";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		onOR : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + "OR" + " ";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		onPareAbre : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + "(";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		onPareFecha : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + ")";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		onMais : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + "+" + " ";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		onMenos : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + "-" + " ";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		onVezes : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + "*" + " ";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		onDivide : function() {
			var filtro = this.getView().byId("inAFiltro").getValue();
			filtro = filtro + " " + "/" + " ";
			this.getView().byId("inAFiltro").setValue(filtro);
		},

		// Filtros
		onAddFilter : function() {
			var tokens = that.byId("inFAtributo").getTokens();
			debugger;
			if (tokens.length > 0) {
				var cond = tokens[0].getKey() + " " + this.getView().byId("comboFOper").getValue() + " " + this.getView().byId("inFValor").getValue();
				var filtro = this.getView().byId("inAFiltro").getValue();
				filtro = filtro + cond + " ";
				this.getView().byId("inAFiltro").setValue(filtro);
			}
			// var cond = this.getView().byId("comboFAtributo").getSelectedKey()
			// + " " + this.getView().byId("comboFOper").getValue() + " " +
			// this.getView().byId("inFValor").getValue();
			// var filtro = this.getView().byId("inAFiltro").getValue();
			// filtro = filtro + cond;
			// this.getView().byId("inAFiltro").setValue(filtro);
		},

		onClearFilter : function() {
			this.onClear("inAFiltro");
		},
		// Ordenação
		onAddOrder : function() {
			var tokens = that.byId("inOAtributo").getTokens();
			if (tokens.length > 0) {
				var cond = tokens[0].getKey() + " " + this.getView().byId("comboOOper").getValue();
				
				var order = this.getView().byId("inAOrder").getValue();
				if(!order){
					order = order + " " + cond;					
				}else{
					order = order + ", " + cond;
				}
				
				this.getView().byId("inAOrder").setValue(order);
			}
			// var cond = this.getView().byId("comboOAtributo").getSelectedKey()
			// + " " + this.getView().byId("comboOOper").getValue();
			// var order = this.getView().byId("inAOrder").getValue();
			// order = order + " " + cond;
			// this.getView().byId("inAOrder").setValue(order);
		},

		onClearOrder : function() {
			this.onClear("inAOrder");
		},

		// Particionamento
		onAddPart : function() {
			var tokens = that.byId("inParticionamento").getTokens();
			if (tokens.length > 0) {
				var cond = tokens[0].getKey();
				var part = this.getView().byId("inAPart").getValue();

				if(!part){
					part = part + " " + cond;					
				}else{
					part = part + ", " + cond;
				}				
//				part = part + " " + cond + " ";
				this.getView().byId("inAPart").setValue(part);
			}
			// var cond =
			// this.getView().byId("comboParticionamento").getSelectedKey();
			// var part = this.getView().byId("inAPart").getValue();
			// part = part + " " + cond;
			// this.getView().byId("inAPart").setValue(part);
		},

		onClearPart : function() {
			this.onClear("inAPart");
		},

		// Ranqueamento por Ordenação
		onAddROrder : function() {
			var tokens = that.byId("inOrder").getTokens();
			if (tokens.length > 0) {
				var cond = tokens[0].getKey() + " " + this.getView().byId("comboType").getValue();
				var rankorder = this.getView().byId("inAROrder").getValue();
				if(!rankorder){
					rankorder = rankorder + " " + cond;					
				}else{
					rankorder = rankorder + ", " + cond;
				}					
//				rankorder = rankorder + " " + cond + " ";
				this.getView().byId("inAROrder").setValue(rankorder);
			}
			// var cond = this.getView().byId("comboROrder").getSelectedKey() +
			// " " + this.getView().byId("comboType").getValue();
			// var rankorder = this.getView().byId("inAROrder").getValue();
			// rankorder = rankorder + " " + cond;
			// this.getView().byId("inAROrder").setValue(rankorder);
		},
		onClearROrder : function() {
			this.onClear("inAROrder");
		},

		onClear : function(oValue) {
			switch (oValue) {
			case "inAFiltro":
				this.getView().byId(oValue).setValue("");
			case "inAOrder":
				this.getView().byId(oValue).setValue("");
			case "inAPart":
				this.getView().byId(oValue).setValue("");
			case "inAROrder":
				this.getView().byId(oValue).setValue("");
			}

		},

		onGravar : function() {

			// Salva o registro
			var oView = this.getView();
			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");
			var oObject = oView.getBindingContext().getObject();
			var model = {};
			that = this;
			var isNew = oViewModel.getProperty("/isNew");

			if (isNew) {

				that.fillModelFromScreen(that, model);
				console.log(JSON.stringify(model));
				// Salva o registro
				oModel.create("/filtroPoliticoOData", model, {
					async : false,
					success : function(oData, response) {
						// oModel.refresh();
						oViewModel.setProperty("/busy", false);
						// Volta para a tela inicial
						that.onProcessar();
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

			} else {
				var tokens = that.byId("inAcao").getTokens();
				if (tokens.length > 0) {
					model.ACTION_ID = parseInt(tokens[0].getKey());
					// model.ACTION_NAME = tokens[0].getText();
				}
				// model.ACTION_ID = this.byId("comboAcao").getSelectedKey();
				this.fillModelFromScreen(that, model);

				var validFrom = this.onConvertDateTime(this.byId("dtValidFrom").getValue());

				console.log(JSON.stringify(model));
				// Atualiza registro sem alterar campos chaves
				oModel.update("/filtroPoliticoOData(ACTION_ID=" + model.ACTION_ID + ",VALID_FROM=datetime'" + validFrom + "')", model, {
					async : false,
					merge : false,
					success : function(oData, response) {
						debugger;

						// sap.m.MessageToast.show("Update Realizado");
						oViewModel.setProperty("/busy", false);

						oModel.refresh();
						that.onProcessar();
						that.onNavBack();
					},
					error : function(oResponseError) {
						var xmlDoc = jQuery.parseXML(oResponseError.responseText);
						debugger;
						// oViewModel.setProperty("/busy", false);
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

		},

		onConvertDateTime : function(date) {
			var array = date.split(" ");
			var aDate = array[0].split("/");
			var dateStr = aDate[2] + "-" + aDate[1] + "-" + aDate[0] + "T" + array[1] + ".0000000";
			return dateStr;
		},

		onDeletar : function() {
			var oView = this.getView();
			var oComponent = this.getOwnerComponent();
			var oModel = this.getModel();
			var oViewModel = this.getModel("objectView");
			var that = this;
			var model = {};

			var tokens = that.byId("inAcao").getTokens();
			if (tokens.length > 0) {
				model.ACTION_ID = tokens[0].getKey();
				// oModelObject.ACTION_NAME = tokens[0].getText();
			}
			// model.ACTION_ID = this.byId("comboAcao").getSelectedKey();

			model.VALID_FROM = this.byId("dtValidFrom").getValue()
			var validFrom = this.onConvertDateTime(model.VALID_FROM);

			var oComponent = this.getOwnerComponent();

			sap.m.MessageBox.confirm("Confirmar exclusão ?", {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						// Apagar registro
						oModel.remove("/filtroPoliticoOData(ACTION_ID=" + model.ACTION_ID + ",VALID_FROM=datetime'" + validFrom + "')", {
							async : false,
							merge : false,
							success : function(oData, response) {
								sap.m.MessageToast.show("Delete Realizado");
								// oModel.refresh();
								// oViewModel.setProperty("/busy", true);
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

		fillModelFromScreen : function(that, model) {
			var oView = this.getView();
			var oViewModel = this.getModel("objectView");
			var tokens = that.byId("inAcao").getTokens();
			if (tokens.length > 0) {
				model.ACTION_ID = parseInt(tokens[0].getKey());
				model.ACTION_NAME = tokens[0].getText();
			}
			// model.ACTION_ID = this.byId("comboAcao").getSelectedKey();
			// model.ACTION_NAME = this.byId("comboAcao").getValue();

			model.BUKRS = this.byId("comboEmpresa").getSelectedKey();
			// model.BUTXT = this.byId("comboEmpresa").getValue();

			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern : "dd/MM/yyyy HH:mm:ss"
			});

			var strDataDesde = dateFormat.parse(this.byId("dtValidFrom").getValue());
			model.VALID_FROM = new Date(strDataDesde);

			var strDataAte = dateFormat.parse(this.byId("dtValidTo").getValue());
			model.VALID_UNTIL = new Date(strDataAte);

			if (this.byId("inDayslastExec").getValue()) {
				model.DAYS_LAST_ACTION = parseInt(this.byId("inDayslastExec").getValue());
			} else {
				model.DAYS_LAST_ACTION = 0;
			}

			model.RULE_WHERE = this.byId("inAFiltro").getValue();
			model.RULE_ORDER = this.byId("inAOrder").getValue();
			model.RANK_PARTITION = this.byId("inAPart").getValue();
			model.RANK_ORDER = this.byId("inAROrder").getValue();
			model.BNAME = "DUMMY";

			if (this.byId("inLimite").getValue()) {
				model.RANK_LIMITE = parseInt(this.byId("inLimite").getValue());
			} else {
				model.RANK_LIMITE = 0;
			}

			// if (this.byId("inQtdReg").getValue()) {
			// model.RECORD_COUNT = parseInt(this.byId("inQtdReg").getValue());
			// } else {
			model.RECORD_COUNT = 0;
			// }

		},
		openCompany : function() {
			this.getView().byId("inAcao").destroyTokens();
			this.aItemsAcao = [];
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

			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
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
					}
					debugger;

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

			// oTable.setModel(this.getModel());
			// oTable.bindRows("/acaoOData");

			var oRowsModel = new sap.ui.model.json.JSONModel();

			if (that.aItemsAcao.length === 0) {
				var where = this.byId("comboEmpresa").getSelectedKey();
				var filters = new Array();
				var filterByID = new sap.ui.model.Filter("BUKRS", sap.ui.model.FilterOperator.EQ, where);
				filters.push(filterByID);
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

		},
		onAtributoHelp : function(nome) {
			debugger;
			var oInput = this.getView().byId("inFAtributo");
			var oModel = this.getModel();
			// This code was generated by the
			// layout editor.
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAtributo1Help", {
				title : "Atributos de Filtro Político",
				supportMultiselect : false,
				key : "COLUMN_NAME",
				descriptionKey : "COMMENTS",
				ok : function(oEvent) {
					// debugger;
					var aTokens = oEvent.getParameter("tokens");
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
					label : "Atributos",
					template : "COMMENTS"
				}, {
					label : "Código do Atributo",
					template : "COLUMN_NAME"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			// oTable.setModel(this.getModel());
			// oTable.bindRows("/atributoFiltrosPoliticosOData");
			//
			// oValueHelp.open();
			// oValueHelp.update();
			oModel.read("/atributoFiltrosPoliticosOData", {
				// filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];
					debugger;
					var sTable = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var sort = {};
						sort.COMMENTS = oResponseSucess.results[i].COMMENTS;
						sort.COLUMN_NAME = oResponseSucess.results[i].COLUMN_NAME;

						sTable.push(sort);
					}

					var sortedTable = sTable.sort(function(a, b) {
						var nameA = a.COMMENTS.toLowerCase(), nameB = b.COMMENTS.toLowerCase();
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
		},

		onOAtributoHelp : function() {
			debugger;
			var oInput = this.getView().byId("inOAtributo");
			var oModel = this.getModel();
			// This code was generated by the
			// layout editor.
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAtributo2Help", {
				title : "Atributos de Filtro Político",
				supportMultiselect : false,
				key : "COLUMN_NAME",
				descriptionKey : "COMMENTS",
				ok : function(oEvent) {
					// debugger;
					var aTokens = oEvent.getParameter("tokens");
					debugger;
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
					label : "Atributos",
					template : "COMMENTS"
				}, {
					label : "Código do Atributo",
					template : "COLUMN_NAME"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			// oTable.setModel(this.getModel());
			// oTable.bindRows("/atributoFiltrosPoliticosOData");
			//
			// oValueHelp.open();
			// oValueHelp.update();
			oModel.read("/atributoFiltrosPoliticosOData", {
				// filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];
					debugger;
					var sTable = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var sort = {};
						sort.COMMENTS = oResponseSucess.results[i].COMMENTS;
						sort.COLUMN_NAME = oResponseSucess.results[i].COLUMN_NAME;

						sTable.push(sort);
					}

					var sortedTable = sTable.sort(function(a, b) {
						var nameA = a.COMMENTS.toLowerCase(), nameB = b.COMMENTS.toLowerCase();
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
		},

		onParticionamentoHelp : function(nome) {
			debugger;
			var oInput = this.getView().byId("inParticionamento");
			var oModel = this.getModel();
			// This code was generated by the
			// layout editor.
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAtributo3Help", {
				title : "Atributos de Filtro Político",
				supportMultiselect : false,
				key : "COLUMN_NAME",
				descriptionKey : "COMMENTS",
				ok : function(oEvent) {
					// debugger;
					var aTokens = oEvent.getParameter("tokens");
					debugger;
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
					label : "Atributos",
					template : "COMMENTS"
				}, {
					label : "Código do Atributo",
					template : "COLUMN_NAME"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			// oTable.setModel(this.getModel());
			// oTable.bindRows("/atributoFiltrosPoliticosOData");
			//
			// oValueHelp.open();
			// oValueHelp.update();
			oModel.read("/atributoFiltrosPoliticosOData", {
				// filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];
					debugger;
					var sTable = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var sort = {};
						sort.COMMENTS = oResponseSucess.results[i].COMMENTS;
						sort.COLUMN_NAME = oResponseSucess.results[i].COLUMN_NAME;

						sTable.push(sort);
					}

					var sortedTable = sTable.sort(function(a, b) {
						var nameA = a.COMMENTS.toLowerCase(), nameB = b.COMMENTS.toLowerCase();
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
		},

		onOrderHelp : function(nome) {
			debugger;
			var oInput = this.getView().byId("inOrder");
			var oModel = this.getModel();
			// This code was generated by the
			// layout editor.
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAtributo4Help", {
				title : "Atributos de Filtro Político",
				supportMultiselect : false,
				key : "COLUMN_NAME",
				descriptionKey : "COMMENTS",
				ok : function(oEvent) {
					// debugger;
					var aTokens = oEvent.getParameter("tokens");
					debugger;
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
					label : "Atributos",
					template : "COMMENTS"
				}, {
					label : "Código do Atributo",
					template : "COLUMN_NAME"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			// oTable.setModel(this.getModel());
			// oTable.bindRows("/atributoFiltrosPoliticosOData");
			//
			// oValueHelp.open();
			// oValueHelp.update();
			// teste
			oModel.read("/atributoFiltrosPoliticosOData", {
				// filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];
					debugger;
					var sTable = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var sort = {};
						sort.COMMENTS = oResponseSucess.results[i].COMMENTS;
						sort.COLUMN_NAME = oResponseSucess.results[i].COLUMN_NAME;

						sTable.push(sort);
					}

					var sortedTable = sTable.sort(function(a, b) {
						var nameA = a.COMMENTS.toLowerCase(), nameB = b.COMMENTS.toLowerCase();
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
		}

	});

});
