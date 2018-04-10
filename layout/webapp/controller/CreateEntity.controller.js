sap.ui.define([ "com/cpfl/layout/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"

], function(BaseController, JSONModel, MessageBox) {
	"use strict";
	var that;
	return BaseController.extend("com.cpfl.layout.controller.CreateEntity", {

		_oBinding : {},

		/* =========================================================== */
		/* lifecycle methods */
		/* =========================================================== */

		onInit : function() {
			that = this;
			this.getRouter().getTargets().getTarget("create").attachDisplay(null, this._onDisplay, this);
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel = new JSONModel({
				enableCreate : false,
				delay : 0,
				busy : false,
				mode : "create",
				viewTitle : ""

			});
			debugger;
			this.setModel(this._oViewModel, "viewModel");
			// if (this._oViewModel.getProperty("/mode") === "edit") {
			// MessageBox.error("Teste");
			// }
			// Register the view with the
			// message manager
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			var oMessagesModel = sap.ui.getCore().getMessageManager().getMessageModel();
			this._oBinding = new sap.ui.model.Binding(oMessagesModel, "/", oMessagesModel.getContext("/"));
			this._oBinding.attachChange(function(oEvent) {
				var aMessages = oEvent.getSource().getModel().getData();
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						that._oViewModel.setProperty("/enableCreate", false);
					}
				}
			});
		},

		/* =========================================================== */
		/* event handlers */
		/* =========================================================== */

		/**
		 * Event handler (attached declaratively) for the view save button.
		 * Saves the changes added by the user.
		 * 
		 * @function
		 * @public
		 */
		onSave : function() {
			var that = this, oModel = this.getModel();
			// abort if the model has not been
			// changed
//			if (!oModel.hasPendingChanges()) {
//				MessageBox.information(this._oResourceBundle.getText("noChangesMessage"), {
//					id : "noChangesInfoMessageBox",
//					styleClass : that.getOwnerComponent().getContentDensityClass()
//				});
//				return;
//			}
			// this.getModel("appView").setProperty("/busy", true);
			if (this._oViewModel.getProperty("/mode") === "edit") {
				// attach to the request
				// completed event of the batch
				var oModelUpdate = {};
				oModel.attachEventOnce("batchRequestCompleted", function(oEvent) {
					if (that._checkIfBatchRequestSucceeded(oEvent)) {
						that._fnUpdateSuccess(oModelUpdate);
					} else {
//						that._fnEntityCreationFailed();
						debugger;

//						MessageBox.error(that._oResourceBundle.getText("updateError"));
					}
				});
				var oModelObject = that.getView().getBindingContext().getObject();
				debugger;
				
				oModelUpdate.LAYOUT_ID = oModelObject.LAYOUT_ID;
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
						that.getView().byId('inAtributo').destroyTokens();
						that._fnUpdateSuccess(oModelUpdate);
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

			} else {
				oModel.read("/genLayoutID", {
					success : function(oResponseSucess) {
						var oModelObject = that.getView().getBindingContext().getObject();
						oModelObject.LAYOUT_ID = oResponseSucess.results[0].GEN_LAYOUT_ID;
						oModel.create("/layoutOData", oModelObject, {
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
										// success : function
										// (oResponseSuccess){
										// MessageBox.alert("Sucesso ao criar");
										// },
										error : function(oResponseError) {
											MessageBox.error("Error!");
										}
									});
								}

								that.getView().byId('inAtributo').destroyTokens();
								that._fnUpdateSuccess(oModelLayoutFields);

							},
							error : function(oResponseSucess) {
								debugger;
								MessageBox.error(that._oResourceBundle.getText("updateError"));

							}
						});

					},
					error : function(oResponseSucess) {
						debugger;
						MessageBox.error(that._oResourceBundle.getText("updateError"));
					}
				});
			}

		},

		_checkIfBatchRequestSucceeded : function(oEvent) {
			var oParams = oEvent.getParameters();
			var aRequests = oEvent.getParameters().requests;
			var oRequest;
			if (oParams.success) {
				if (aRequests) {
					for (var i = 0; i < aRequests.length; i++) {
						oRequest = oEvent.getParameters().requests[i];
						if (!oRequest.success) {
							return false;
						}
					}
				}
				return true;
			} else {
				return false;
			}
		},

		/**
		 * Event handler (attached declaratively) for the view cancel button.
		 * Asks the user confirmation to discard the changes.
		 * 
		 * @function
		 * @public
		 */
		onCancel : function() {
			// check if the model has been
			// changed
			if (this.getModel().hasPendingChanges()) {
				// get user confirmation first
				this._showConfirmQuitChanges(); // some
				// other
				// thing
				// here....
			} else {
				this.getModel("appView").setProperty("/addEnabled", true);
				// cancel without confirmation
				this._navBack();
			}
		},

		/* =========================================================== */
		/*
		 * Internal functions /*
		 * ===========================================================
		 */
		/**
		 * Navigates back in the browser history, if the entry was created by
		 * this app. If not, it navigates to the Details page
		 * 
		 * @private
		 */
		_navBack : function() {
			var oHistory = sap.ui.core.routing.History.getInstance(), sPreviousHash = oHistory.getPreviousHash();

			this.getView().unbindObject();
			if (sPreviousHash !== undefined) {
				// The history contains a
				// previous entry
				history.go(-1);
			} else {
				this.getRouter().getTargets().display("object");
			}
		},

		/**
		 * Opens a dialog letting the user either confirm or cancel the quit and
		 * discard of changes.
		 * 
		 * @private
		 */
		_showConfirmQuitChanges : function() {
			var oComponent = this.getOwnerComponent(), oModel = this.getModel();
			var that = this;
			MessageBox.confirm(this._oResourceBundle.getText("confirmCancelMessage"), {
				styleClass : oComponent.getContentDensityClass(),
				onClose : function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						that.getModel("appView").setProperty("/addEnabled", true);
						oModel.resetChanges();
						that._navBack();
					}
				}
			});
		},

		/**
		 * Prepares the view for editing the selected object
		 * 
		 * @param {sap.ui.base.Event}
		 *            oEvent the display event
		 * @private
		 */
		_onEdit : function(oEvent) {
			var oData = oEvent.getParameter("data"), oView = this.getView();
			this._oViewModel.setProperty("/mode", "edit");
			this._oViewModel.setProperty("/enableCreate", true);
			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("editViewTitle"));

			oView.bindElement({
				path : oData.objectPath
			});
			var oModel = this.getModel();
			var oView = this.getView(), oElementBinding = oView.getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();
			// oResourceBundle = this.getResourceBundle(),
			// oObject = oView.getModel().getObject(sPath),
			// sObjectId = oObject.LAYOUT_ID,
			// sObjectName = oObject.NAME;
			debugger;
			oModel.read(sPath + "/camposLayoutOData", {
				success : function(oResponseSucess) {
					that.getView().byId('inAtributo').destroyTokens();
					for (var i = 0; oResponseSucess.results; i++) {
						var oToken = new sap.m.Token();
						oToken.setKey(oResponseSucess.results[i].LAYOUT_FIELDS_ID);
						oToken.setText(oResponseSucess.results[i].COLLUMN_NAME);
						that.getView().byId('inAtributo').addToken(oToken);
						that.getView().byId('inAtributo').openMultiLine();
					}
				}
			});
		},

		/**
		 * Prepares the view for creating new object
		 * 
		 * @param {sap.ui.base.Event}
		 *            oEvent the display event
		 * @private
		 */

		_onCreate : function(oEvent) {
			if (oEvent.getParameter("name") && oEvent.getParameter("name") !== "create") {
				this._oViewModel.setProperty("/enableCreate", false);
				this.getRouter().getTargets().detachDisplay(null, this._onDisplay, this);
				this.getView().unbindObject();
				return;
			}

			this._oViewModel.setProperty("/viewTitle", this._oResourceBundle.getText("createViewTitle"));
			this._oViewModel.setProperty("/mode", "create");
			var oContext = this._oODataModel.createEntry("layoutOData", {
				success : this._fnEntityCreated.bind(this),
				error : this._fnEntityCreationFailed.bind(this)
			});
			this.getView().setBindingContext(oContext);
		},

		/**
		 * Checks if the save button can be enabled
		 * 
		 * @private
		 */
		_validateSaveEnablement : function() {
			var aInputControls = this._getFormFields(this.byId("newEntitySimpleForm"));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreate", false);
						return;
					}
				}
			}
			this._checkForErrorMessages();
		},

		/**
		 * Checks if there is any wrong inputs that can not be saved.
		 * 
		 * @private
		 */

		_checkForErrorMessages : function() {
			var aMessages = this._oBinding.oModel.oData;
			if (aMessages.length > 0) {
				var bEnableCreate = true;
				for (var i = 0; i < aMessages.length; i++) {
					if (aMessages[i].type === "Error" && !aMessages[i].technical) {
						bEnableCreate = false;
						break;
					}
				}
				this._oViewModel.setProperty("/enableCreate", bEnableCreate);
			} else {
				this._oViewModel.setProperty("/enableCreate", true);
			}
		},

		/**
		 * Handles the success of updating an object
		 * 
		 * @private
		 */
		_fnUpdateSuccess : function(oData) {
			debugger;
			this.getModel("appView").setProperty("/busy", false);
			this.getModel("appView").setProperty("/itemToSelect",oData.LAYOUT_ID );
			this.getView().unbindObject();
			this.getRouter().getTargets().display("object");
//			 this.getRouter().navTo("object", {
//			 LAYOUT_ID: oData.LAYOUT_ID			 
//			 }, true);

		},

		/**
		 * Handles the success of creating an object
		 * 
		 * @param {object}
		 *            oData the response of the save action
		 * @private
		 */
		_fnEntityCreated : function(oData) {
			var sObjectPath = this.getModel().createKey("layoutOData", oData);
			this.getModel("appView").setProperty("/itemToSelect", "/" + sObjectPath); // save
			// last
			// created
			this.getModel("appView").setProperty("/busy", false);
			this.getRouter().getTargets().display("object");
		},

		/**
		 * Handles the failure of creating/updating an object
		 * 
		 * @private
		 */
		_fnEntityCreationFailed : function() {
			this.getModel("appView").setProperty("/busy", false);
		},

		/**
		 * Handles the onDisplay event which is triggered when this view is
		 * displayed
		 * 
		 * @param {sap.ui.base.Event}
		 *            oEvent the on display event
		 * @private
		 */
		_onDisplay : function(oEvent) {
			debugger;
			var oData = oEvent.getParameter("data");
			if (oData && oData.mode === "update") {
				this._onEdit(oEvent);
			} else {
				this._onCreate(oEvent);
			}
		},

		/**
		 * Gets the form fields
		 * 
		 * @param {sap.ui.layout.form}
		 *            oSimpleForm the form in the view.
		 * @private
		 */
		_getFormFields : function(oSimpleForm) {
			debugger;
			var aControls = [];
			var aFormContent = oSimpleForm.getContent();
			var sControlType;
			debugger;
			for (var i = 0; i < aFormContent.length; i++) {
				sControlType = aFormContent[i].getMetadata().getName();
				if (sControlType === "sap.m.Input" || sControlType === "sap.m.DateTimeInput" || sControlType === "sap.m.CheckBox") {
					aControls.push({
						control : aFormContent[i],
						required : aFormContent[i - 1].getRequired && aFormContent[i - 1].getRequired()
					});
				}
			}
			return aControls;
		},
		onAtributoHelp : function() {
			// debugger;
			var oInput = this.getView().byId("inAtributo");
			// This code was generated by the
			// layout editor.
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idAtributoHelp", {
				// supportRanges: true,
				supportMultiselect : true,
				// key:
				// "INSTALLATION_TYPE_ID",
				descriptionKey : "COLUMN_NAME",
				ok : function(oEvent) {
					// debugger;
					var aTokens = oEvent.getParameter("tokens");
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
					label : "Atributos",
					template : "COLUMN_NAME"
				} ]
			});

			var oTable = oValueHelp.getTable();
			oTable.setModel(oColModel, "columns");

			oTable.setModel(this.getModel());
			oTable.bindRows("/atributoFiltrosPoliticosOData");

			oValueHelp.open();
			oValueHelp.update();
		}
	});

});