/*global location*/
sap.ui.define([ "com/cpfl/layout/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/layout/model/formatter", "sap/m/MessageBox", "sap/m/MessageToast" ], function(BaseController, JSONModel, History, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("com.cpfl.layout.controller.Object", {

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
				validar : true,
				identificador : "",
			});

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

		onCancelar : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/busy", true);
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);

			// var oView = this.getView();
			// var oElementBinding = oView.getElementBinding();
			// var sPath = oElementBinding.sPath;
			this.getView().unbindElement();
			this.onNavBack();
		},

		onNavBack : function() {
			debugger;
			var oViewModel = this.getModel("objectView");
			// Ajusta os botões
			oViewModel.setProperty("/btProcessarVisible", true);
			oViewModel.setProperty("/btSalvarVisible", false);
			oViewModel.setProperty("/btApagarVisible", false);
			oViewModel.setProperty("/btCancelarVisible", false);
			oViewModel.setProperty("/formEditable", false);
			var sPreviousHash = History.getInstance().getPreviousHash();
			this.getView().unbindElement();
			// if (sPreviousHash !== undefined) {
			// history.go(-1);
			// } else {
			this.getRouter().navTo("worklist", {}, true);
			// }
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
						var sPath = "/layoutOData(" + action_id + ")";

						oModel.remove(sPath);

						// Volta para a tela inicial
						that.onNavBack();
					}
				}
			});

		},

		onGravar : function() {

			var oViewModel = this.getModel("objectView");
			var isNew = oViewModel.getProperty("/isNew");
			var oModel = this.getModel();
			var that = this;
			var oModelObject = {};
			debugger;
			oModelObject.NAME = this.byId("inName").getValue();
			oModelObject.INTEGRATION_FILE_DELIMITER = this.byId("inDelimitador").getValue();
			this._validateFields();

			var ok = oViewModel.getProperty("/validar");
			if (ok) {
				if (isNew) {
					debugger;
					oModel.read("/genLayoutID", {
						success : function(oResponseSucess) {
							// var oModelObject =
							// that.getView().getBindingContext().getObject();
							oModelObject.LAYOUT_ID = oResponseSucess.results[0].GEN_LAYOUT_ID;
							oModel.create("/layoutOData", oModelObject, {
								async : false,
								success : function(oResponseSucess) {

									debugger;
									oModel.refresh();
									// window.vCreateEntity = true;
									// debugger;
									var oTokens = that.getView().byId('inAtributo').getTokens();

									for (var i = 0; i < oTokens.length; i++) {
										var token = oTokens[i];
										var oModelLayoutFields = {};
										oModelLayoutFields.LAYOUT_ID = oModelObject.LAYOUT_ID;
										oModelLayoutFields.LAYOUT_FIELDS_ID = i + 1;
										oModelLayoutFields.MASK_FORMULA = "";
										oModelLayoutFields.COLLUMN_NAME = token.getText();
										oModel.create("/layoutFieldsOData", oModelLayoutFields, {

											error : function(oResponseError) {
												// MessageBox.error("Error!");
											}
										});
									}

									that.getView().byId('inAtributo').destroyTokens();
									that.onNavBack();

								},
								error : function(oResponseSucess) {
									debugger;
									MessageBox.error("Erro ao criar Layout");

								}
							});

						},
						error : function(oResponseSucess) {
							debugger;
							MessageBox.error("Erro ao gerar ID do Layout!");
						}
					});
				} else {
					debugger;
					var oModelUpdate = {};

					debugger;

					oModelUpdate.LAYOUT_ID = oViewModel.getProperty("/identificador");
					oModelUpdate.NAME = oModelObject.NAME;
					oModelUpdate.INTEGRATION_FILE_DELIMITER = oModelObject.INTEGRATION_FILE_DELIMITER;
					oModelUpdate.LAYOUT_FIELDS = [];
					var oTokens = that.getView().byId('inAtributo').getTokens();
					for (var i = 0; i < oTokens.length; i++) {
						var token = oTokens[i];
						var oModelLayoutFields = {};
						oModelLayoutFields.LAYOUT_FIELDS_ID = i + 1;
						oModelLayoutFields.MASK_FORMULA = "";
						oModelLayoutFields.COLLUMN_NAME = token.getText();
						oModelUpdate.LAYOUT_FIELDS.push(oModelLayoutFields);
					}
					jQuery.ajax({
						url : "/accs/services/updateLayout.xsjs",
						method : 'PUT',
						data : JSON.stringify(oModelUpdate),
						contentType : 'application/json; charset=utf-8',

						success : function(oData, response) {

							oModel.refresh();
							that.getView().byId("inAtributo").destroyTokens();
							that.onNavBack();
							// that._fnUpdateSuccess(oModelUpdate);
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
			oViewModel.setProperty("/viewTitle", "Modificação - Layout");
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
				var oView = this.getView();
				oViewModel.setProperty("/identificador", "Novo");
				this.onProcessar();
				oViewModel.setProperty("/viewTitle", "Criar - Layout");
				this.byId("inName").setValue("");
				this.byId("inDelimitador").setValue("");
				this.getView().byId('inAtributo').destroyTokens();

				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/isNew", true);

				var bindingContext = oView.getBindingContext();
				if (bindingContext) {
					this.getView().unbindElement();
				}
				this.getModel().metadataLoaded().then(function() {
					var oEntry = oView.getModel().createEntry("layoutOData");
					oView.setBindingContext(oEntry);
				}.bind(this));
				oViewModel.setProperty("/busy", false);
			} else {
				debugger;
				oViewModel.setProperty("/identificador", sObjectId);
				oViewModel.setProperty("/btProcessarVisible", true);
				oViewModel.setProperty("/btSalvarVisible", false);
				oViewModel.setProperty("/btApagarVisible", false);
				oViewModel.setProperty("/btCancelarVisible", false);
				oViewModel.setProperty("/formEditable", false);
				oViewModel.setProperty("/viewTitle", "Exibir - Layout");
				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("layoutOData", {
						LAYOUT_ID : sObjectId
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
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived : function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		
	
		
		_validateFields : function() {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/validar", true);

			if (this.byId("inName").getValue() === "") {
				sap.m.MessageToast.show("Preencher Nome", {
					of : this.getView().byId("inName")
				});
				oViewModel.setProperty("/validar", false);
				return;
			}
		},
		_onBindingChange : function() {
			var oView = this.getView(), oViewModel = this.getModel("objectView"), oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(), oObject = oView.getBindingContext().getObject(), sObjectId = oObject.LAYOUT_ID, sObjectName = oObject.NAME;

			debugger;
			var oView = this.getView(), oModel = this.getModel();
			var sPath = oElementBinding.getBoundContext().getPath();
			var that = this;
			debugger;
			oModel.read(sPath + "/camposLayoutOData", {
				success : function(oResponseSucess) {
					that.getView().byId("inAtributo").destroyTokens();
					for (var i = 0; oResponseSucess.results; i++) {
						var oToken = new sap.m.Token();
						oToken.setKey(oResponseSucess.results[i].COMMENTS);
						oToken.setText(oResponseSucess.results[i].COLLUMN_NAME);
						that.getView().byId("inAtributo").addToken(oToken);
						that.getView().byId("inAtributo").openMultiLine();
					}
				}
			});

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [ sObjectName ]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [ sObjectId ]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [ sObjectName, sObjectId, location.href ]));
		},
		onAtributoHelp : function(nome) {
			debugger;
			var oInput = this.getView().byId("inAtributo");
			var that = this;
			var oModel = this.getModel();
			// This code was generated by the
			// layout editor.
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAtributo1Help", {
				basicSearchText : this.getView().byId("inAtributo").getValue(),				
				title : "Atributos de Filtro Político",
				supportMultiselect : true,
				key : "COMMENTS",
				descriptionKey : "COLUMN_NAME", 
				ok : function(oEvent) {
					 debugger;
					 oInput.destroyTokens();
					var aTokens = oEvent.getParameter("tokens");
					for (var i = 0; i < aTokens.length; i++) {
						var token = aTokens[i];
						var str = token.getText();
						var index = str.indexOf("(");
						var text = str.substring(0,index);
						token.setText(text.trim());
						oInput.addToken(token);
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
					debugger;
//					var dataRows1 = [];
//					for (var i = 0; i < sortedTable.length; i++) {
//						var data = {};
//						data.COMMENTS = sortedTable[i].COMMENTS.toString();
//						data.COLUMN_NAME = sortedTable[i].COLUMN_NAME;
//						dataRows1.push(data);
//					}
					var oRowsModel = new sap.ui.model.json.JSONModel();
					oRowsModel.setData(sortedTable);
					oTable.setModel(oRowsModel);
					if (oTable.bindRows) {
						oTable.bindRows("/");
					}
					debugger;
					var aTokens = that.getView().byId("inAtributo").getTokens();
					oValueHelp.setTokens(aTokens);
					
					oValueHelp.addStyleClass("sapUiSizeCozy");
					oValueHelp.open();
					oValueHelp.update();

				},
				error : function(oResponseSucess) {

				}

			});
		},
//		onAtributoHelp : function() {
//			debugger;
//			var oInput = this.getView().byId("inAtributo");
//			// This code was generated by the
//			// layout editor.
//			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAtributoHelp", {
//				title : "Atributos de Filtro Político",
//				supportMultiselect : true,
//				// key:
//				// "INSTALLATION_TYPE_ID",
//				descriptionKey : "COLUMN_NAME",
//				ok : function(oEvent) {
//					// debugger;
//					var aTokens = oEvent.getParameter("tokens");
//					oInput.setTokens(aTokens);
//					oValueHelp.close();
//				},
//				cancel : function() {
//					oValueHelp.close();
//				},
//				afterClose : function() {
//					oValueHelp.destroy();
//				}
//
//			});
//
//			var oColModel = new sap.ui.model.json.JSONModel();
//			oColModel.setData({
//				cols : [ {
//					label : "Atributos",
//					template : "COLUMN_NAME"
//				} ,
//				{
//					label : "Descrição",
//					template : "COMMENTS"
//				}]
//			});
//
//			var oTable = oValueHelp.getTable();
//			oTable.setModel(oColModel, "columns");
//
//			oTable.setModel(this.getModel());
//			oTable.bindRows("/atributoFiltrosPoliticosOData");
//
//			oValueHelp.open();
//			oValueHelp.update();
//		}

	});

});