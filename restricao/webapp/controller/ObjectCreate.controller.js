/*global location*/
sap.ui.define([
        "sap/m/Token", "com/cpfl/restricao/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "com/cpfl/restricao/model/formatter", "sap/m/MessageBox", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/Button", "sap/m/MessageToast"

], function(Token, BaseController, JSONModel, History, formatter, MessageBox, Filter, FilterOperator, Button, MessageToast){
	"use strict";
	var that;
	var tokensSize;
	return BaseController.extend("com.cpfl.restricao.controller.ObjectCreate", {
	    formatter : formatter, 

	    /* =========================================================== */
	    /* lifecycle methods */
	    /* =========================================================== */
	    /**
		 * Called when the worklist controller is instantiated.
		 * 
		 * @public
		 */
	    onInit : function(){ 
		    // Model used to manipulate control states. The chosen values make
		    // sure,
		    // detail page is busy indication immediately so there is no break
		    // in
		    // between the busy indication for loading the view's meta data
		    that = this;
		    var iOriginalBusyDelay, oViewModel = new JSONModel({
		        busy : true,
		        delay : 0,
		        btProcessarVisible : false,
		        btSalvarVisible : true,
		        btApagarVisible : true,
		        btCancelarVisible : true,
		        formEditable : true,
		        isNew : false,
		        fragmentIndividualVisible : false,
		        fragmentAreaRiscoVisible : false,
		        fragmentCNAEVisible : false,
		        tipoRestricaoSelectedKey : -1

		    });
		    this._oResourceBundle = this.getResourceBundle();

		    this.getRouter().getRoute("objectCreate").attachPatternMatched(this._onObjectMatched, this);
		    // Store original busy indicator delay, so it can be restored later
		    // on
		    iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
		    this.setModel(oViewModel, "objectView");
		    this.getOwnerComponent().getModel().metadataLoaded().then(function(){
			    // Restore original busy indicator delay for the object view
			    oViewModel.setProperty("/delay", iOriginalBusyDelay);
		    });

		    var oMotivoSelect = this.getView().byId("inputReason");

		    oMotivoSelect.addButton(new Button({
		        text : this._oResourceBundle.getText("buttonOpenMotivosRestricaoText"),
		        press : this.onGoToMotivoRestricaoApp
		    }));

	    },

	    /**
		 * Event handler for navigating back. It there is a history entry or an previous app-to-app navigation we go one step back in the browser history If not, it will replace the current entry of the browser history with the worklist route.
		 * 
		 * @public
		 */
	    onNavBack : function(){
		    var oViewModel = this.getModel("objectView");
		    // Ajusta os botões
		    oViewModel.setProperty("/formEditable", false);
		    var sPreviousHash = History.getInstance().getPreviousHash();
		    // oCrossAppNavigator =
		    // sap.ushell.Container.getService("CrossApplicationNavigation");
		    if (sPreviousHash !== undefined) {// ||
			    // !oCrossAppNavigator.isInitialNavigation())
			    // {
			    history.go(-1);
		    } else {
			    this.getRouter().navTo("worklist", {}, true);
		    }
	    },
	    /**
		 * Event handler for navigating back. It there is a history entry or an previous app-to-app navigation we go one step back in the browser history If not, it will replace the current entry of the browser history with the worklist route.
		 * 
		 * @public
		 */
	    onNavToWorklist : function(){
		    var oViewModel = this.getModel("objectView");
		    // Ajusta os botões
		    oViewModel.setProperty("/formEditable", false);

		    this.getRouter().navTo("worklist", {}, true);
	    },
	   
	    clearForm : function(){
		    this.byId("inputTipoRestricao").setSelectedIndex(-1);

		    this.byId("inputRestrictionId").setValue("");
		    this.byId("inputDescription").setValue("");
		    this.byId("inputReason").setSelectedKey("");
		    this.byId("inputValDesde").setValue("");
		    this.byId("inputValAte").setValue("");
		    this.byId("inputNome").setValue("");
		    this.byId("inputTipoRestricaoInv").setValue("");
		    this.byId("inputIndividualContaContrato").setValue("");
		    this.byId("inputIndividualParceiro").setValue("");
		    this.byId("inputIndividualInstalacao").setValue("");
//		    this.byId("inputCnaeCnae").setValue("");
		    this.byId("inputCnaeCnae").destroyTokens();
		    this.byId("inputAreaRiscoUF").setValue("");
		    this.byId("inputAreaRiscoUF").setDescription("");
		    this.byId("inputAreaRiscoMunicipio").setValue("");
		    this.byId("inputAreaRiscoMunicipio").setDescription("");
		    this.byId("inputAreaRiscoBairro").setValue("");
		    this.byId("inputAreaRiscoBairro").setDescription("");
//		    this.byId("inputAreaRiscoLogradouro").setValue("");
//		    this.byId("inputAreaRiscoLogradouro").setDescription("");
		    this.byId("inputAreaRiscoLogradouro").destroyTokens();

	    },
	    hideFragments : function(){
	    	var oViewModel = that.getModel("objectView");
	    	var data = oViewModel.getData();
	    	data.fragmentIndividualVisible = false;
	    	data.fragmentAreaRiscoVisible = false;
	    	data.fragmentCNAEVisible = false;
	    	    	
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
	    _onObjectMatched : function(oEvent){
		    var oViewModel = this.getModel("objectView");
		    var oView = this.getView();
		    var sObjectId = oEvent.getParameter("arguments").objectId;
		    tokensSize = 0;
		    this.clearForm();
		    this.hideFragments();

		    this.getModel().metadataLoaded().then(function(){
			    var oEntry = oView.getModel().createEntry("RestricaoOData");
			    oView.setBindingContext(oEntry);

			    if (sObjectId !== "Novo") {
				    var jsonModel = sap.ui.getCore().getModel("editModel");
				    oViewModel.setProperty("/isNew", false);
				    oViewModel.setProperty("/btApagarVisible",true);

				    this.byId("inputRestrictionId").setValue(jsonModel.getData().objectId);
				    this.byId("inputDescription").setValue(jsonModel.getData().inputDescription);
				    this.byId("inputReason").setSelectedKey(jsonModel.getData().inputReason);
				    this.byId("inputValDesde").setValue(jsonModel.getData().inputValDesde);
				    this.byId("inputValAte").setValue(jsonModel.getData().inputValAte);
				    this.byId("inputNome").setValue(jsonModel.getData().inputNome);
				    this.byId("inputTipoRestricao").setSelectedIndex(jsonModel.getData().inputTipoRestricao);
				    this.byId("inputTipoRestricaoInv").setValue(jsonModel.getData().inputTipoRestricao);
				    if (jsonModel.getData().inputTipoRestricao === 0) {
					    this.byId("inputIndividualContaContrato").setValue(jsonModel.getData().inputIndividualContaContrato);
					    this.byId("inputIndividualParceiro").setValue(jsonModel.getData().inputIndividualParceiro);
					    this.byId("inputIndividualInstalacao").setValue(jsonModel.getData().inputIndividualInstalacao);
				    } else if (jsonModel.getData().inputTipoRestricao === 2) {
				    	debugger;
				    	var str = jsonModel.getData().inputCnaeCnae;
				    	var res = str.split(",");
				    	for (var i = 0; i < res.length; i++) {
				    		if	(res[i] !== " "){
								var token = new sap.m.Token();
								token.setKey(res[i].trim());
								token.setText(res[i].trim());
								this.byId("inputCnaeCnae").addToken(token);
				    		}
						}
//					    this.byId("inputCnaeCnae").setValue(jsonModel.getData().inputCnaeCnae);
				    } else if (jsonModel.getData().inputTipoRestricao === 1) {
					    this.byId("inputAreaRiscoUF").setValue(jsonModel.getData().inputAreaRiscoUF);
					    this.byId("inputAreaRiscoMunicipio").setValue(jsonModel.getData().inputAreaRiscoMunicipio);
					    this.byId("inputAreaRiscoBairro").setValue(jsonModel.getData().inputAreaRiscoBairro);
//					    this.byId("inputAreaRiscoLogradouro").setValue(jsonModel.getData().inputAreaRiscoLogradouro);
					    this.byId("inputAreaRiscoUF").fireSubmit();
					    this.byId("inputAreaRiscoMunicipio").fireSubmit();
					    this.byId("inputAreaRiscoBairro").fireSubmit();
//					    this.byId("inputAreaRiscoLogradouro").fireSubmit();
					    
				    	var str = jsonModel.getData().inputAreaRiscoLogradouro;
				    	var res = str.split(",");
				    	for (var i = 0; i < res.length; i++) {
				    		if	(res[i] !== " "){
								var token = new sap.m.Token();
								token.setKey(res[i].trim());
								token.setText(res[i].trim());
								this.byId("inputAreaRiscoLogradouro").addToken(token);
				    		}
						}					    
					    
					    
				    }

				    this._VerifyRestricaoPanelByTipoRestricao(jsonModel.getData().inputTipoRestricao);

				    var acoes = jsonModel.getData().itensAcao;
				    var acoesModel = {};
				    acoesModel.tableItems = [];

				    var empresa;

				    for (var i = 0; i < acoes.length; i++) {
					    var itemTable = acoes[i];
					    empresa = itemTable.codEmpresa;
					    acoesModel.tableItems.push({
					    	RESTRICTION_ID: jsonModel.getData().objectId,
					    	ACTION_ID : itemTable.codAcao,
					    	NAME : itemTable.DescAcao,
					        BUKRS : itemTable.codEmpresa,
					        BUTXT : itemTable.descEmpresa
					    });

				    }

				    this.byId("inputAcaoEmpresa").setSelectedKey(empresa);

				    that.setModel(new JSONModel(acoesModel), "acoesModel");

				    oViewModel.setProperty("/formEditable", true);

			    } else {
				    oViewModel.setProperty("/isNew", true);
				    oViewModel.setProperty("/btApagarVisible",false);
				    that.setModel(new JSONModel({
					    tableItems : []
				    }), "acoesModel");
			    }

		    }.bind(this));

		    oViewModel.setProperty("/formEditable", true);
		    oViewModel.setProperty("/busy", false);
	    },

	    /**
		 * @memberOf com.cpfl.restricao.controller.Object
		 */
	    onCancelar : function(){
		    var oViewModel = this.getModel("objectView");
		    oViewModel.setProperty("/busy", false);
		    this.getModel("objectView").setProperty("/tipoRestricaoSelectedKey", -1);
		    // Reseta o model para o inicial

		    this.getView().unbindElement();
		    this.onNavBack();
	    },
	    /**
		 * @memberOf com.cpfl.restricao.controller.Object
		 */
	    onDeletar : function(){

		    var oComponent = this.getOwnerComponent(), oModel = this.getModel();
		    var that = this;
		    MessageBox.confirm(this._oResourceBundle.getText("confirmDeleteMessage"), {
		        styleClass : oComponent.getContentDensityClass(),
		        onClose : function(oAction){
			        if (oAction === sap.m.MessageBox.Action.OK) {
				        // Apaga o registro
				        var jsonModel = sap.ui.getCore().getModel("editModel");
				        var sPath = "/RestricaoOData(" + jsonModel.getData().objectId + ")";
				        oModel.remove(sPath);

				        // Volta para a tela inicial
				        that.onNavToWorklist();
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
	    fillModelRestricaoFromScreen : function(that, model, modelCnae, modelIndivicual, modelLocal){
	    	debugger;
		    model.DESCRIPTION = that.byId("inputDescription").getValue();
		    model.RESTRICTION_REASON_ID = that.byId("inputReason").getSelectedKey();
		    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
			    pattern : "dd/MM/yyyy"
		    });
		    
		       
		    var strDataDesde = dateFormat.parse(that.byId("inputValDesde").getValue());
		    model.VALID_FROM = new Date(strDataDesde);

		    var strDataAte = dateFormat.parse(that.byId("inputValAte").getValue());
		    model.VALID_UNTIL = new Date(strDataAte);

		    model.BNAME = that.byId("inputNome").getValue();
		    model.RESTRICTION_TYPE = that.byId("inputTipoRestricaoInv").getValue();

		    if (model.RESTRICTION_TYPE === "INDIVIDUAL") {
			    modelIndivicual.RESTRICTION_ID = model.RESTRICTION_ID;
			    modelIndivicual.VKONT = that.byId("inputIndividualContaContrato").getValue();
			    modelIndivicual.PARTNER = that.byId("inputIndividualParceiro").getValue();
			    modelIndivicual.ANLAGE = that.byId("inputIndividualInstalacao").getValue();

		    }
		    if (model.RESTRICTION_TYPE === "CNAE") {
		    	debugger;
			    modelCnae.RESTRICTION_ID = model.RESTRICTION_ID;
//			    modelCnae.CNAE = that.byId("inputCnaeCnae").getValue();
			    debugger;
			    var oTokens = that.byId("inputCnaeCnae").getTokens();
			    if(oTokens.length > 0){
			    	var string = "";
			    	for (var i = 0; i < oTokens.length; i++) {
			    		var token = oTokens[i];
						string += token.getKey() + ", ";
					}
			    	modelCnae.CNAE = string;
			    }

		    }
		    if (model.RESTRICTION_TYPE === "LOCATION") {
			    modelLocal.RESTRICTION_ID = model.RESTRICTION_ID;
			    modelLocal.COUNTRY = "BR";
			    modelLocal.REGION = that.byId("inputAreaRiscoUF").getValue();
			    modelLocal.CITY_CODE = that.byId("inputAreaRiscoMunicipio").getValue();
			    modelLocal.CITYP_CODE = that.byId("inputAreaRiscoBairro").getValue();
//			    modelLocal.STREET_CODE = that.byId("inputAreaRiscoLogradouro").getValue();
			    debugger;
			    var oTokens = that.byId("inputAreaRiscoLogradouro").getTokens();
			    if(oTokens.length > 0){
			    	var string = "";
			    	for (var i = 0; i < oTokens.length; i++) {
			    		var token = oTokens[i];
						string += token.getKey() + ", ";
					}
			    	modelLocal.STREET_CODE = string;
			    }			    
			    
			    

		    }

		    console.log("Restrição::::\n" + JSON.stringify(model));
		    console.log("RestriçãoIndividual::::\n" + JSON.stringify(modelIndivicual));
		    console.log("RestriçãoCNAE::::\n" + JSON.stringify(modelCnae));
		    console.log("RestriçãoLocal::::\n" + JSON.stringify(modelLocal));
	    },

	    /**
		 * @memberOf com.cpfl.restricao.controller.Object
		 */
	    onGravar : function(){
		    var oModel = this.getModel();
		    var oView = this.getView();
		    var oViewModel = this.getModel("objectView");
		    oViewModel.setProperty("/busy", true);
		    var isNew = oViewModel.getProperty("/isNew");
		    var model = {}, modelIndividual = {}, modelCnae = {}, modelLocal = {};
		    that = this;

		    // var that = this;
		    if (isNew) {
			    var genId = oModel.read("/genRestrictionId", {
			        success : function(oResponseSucess){
			        	debugger;
				        model.RESTRICTION_ID = oResponseSucess.results[0].GEN_RESTRICTION_ID;
				        that.fillModelRestricaoFromScreen(that, model, modelCnae, modelIndividual, modelLocal);

				        // Salva o registro
				        oModel.create("/RestricaoOData", model, {
				            async : false,
				            success : function(oData, response){

					            oModel.refresh();
					            oViewModel.setProperty("/busy", false);
					            that.onNavToWorklist();

				            },
				            error : function(oResponseError){
					            var xmlDoc = jQuery.parseXML(oResponseError.responseText);
					            var txtErro = "";
					            if (xmlDoc.getElementsByTagName("DETAIL")[0]){
					            	txtErro = xmlDoc.getElementsByTagName("DETAIL")[0].childNodes[0];
					            }else if(xmlDoc.getElementsByTagName("message")[0]){
					            	txtErro = xmlDoc.getElementsByTagName("message")[0].childNodes[0];
					            }
					            
					            MessageBox.error(txtErro.data, {
					                id : "serviceErrorMessageBox",
					                details : xmlDoc.getElementsByTagName("message")[0].childNodes[0].data + "\n ########## model\n" + JSON.stringify(model) + "\n ########## modelCnae\n" + JSON.stringify(modelCnae) + "\n ########## modelIndividual\n" + JSON.stringify(modelIndividual)
					                        + "\n ########## modelLocal \n" + JSON.stringify(modelLocal),
					                actions : [
						                MessageBox.Action.CLOSE
					                ],
					                onClose : function(){
						                oViewModel.setProperty("/busy", false);

					                }.bind(this)
					            });
				            }
				        });
				        // Tipo de restição
				        if (model.RESTRICTION_TYPE === "INDIVIDUAL") {
					        modelIndividual.RESTRICTION_ID = model.RESTRICTION_ID;
					        oModel.create("/RestricaoIndividualOData", modelIndividual, {
					            async : true,
					            error : function(oResponseError){
					            }
					        });
				        }
				        if (model.RESTRICTION_TYPE === "CNAE") {
					        modelCnae.RESTRICTION_ID = model.RESTRICTION_ID;
					        oModel.create("/RestricaoCNAEOData", modelCnae, {
					            async : true,
					            error : function(oResponseError){
					            }
					        });
				        }
				        if (model.RESTRICTION_TYPE === "LOCATION") {
					        modelLocal.RESTRICTION_ID = model.RESTRICTION_ID;
					        oModel.create("/RestricaoLocalidadeOData", modelLocal, {
					            async : true,
					            error : function(oResponseError){
					            }
					        });
				        }

				        var acoesModel = that.getModel("acoesModel");
				        var acoesObject = acoesModel.getData();
				        var tableItems = acoesObject.tableItems;
				        var jsonModel = [];
				        for (var i = 0; i < tableItems.length; i++) {
					        var item = tableItems[i];
					        var itemO
					        jsonModel.push();
					        item.RESTRICTION_ID = model.RESTRICTION_ID;
					        console.log(JSON.stringify(item));
					        oModel.create("/RestricaoAcaoOData", item, {
					            async : true,
					            error : function(oResponseError){
					            }
					        });

				        }
			        },
			        error : function(oError){
			        }
			    });

		    } else {
			    model.RESTRICTION_ID = this.byId("inputRestrictionId").getValue();
			    that.fillModelRestricaoFromScreen(that, model, modelCnae, modelIndividual, modelLocal);
			    
			   	model.RESTRICTION_UNIT = modelIndividual;
				model.RESTRICTION_CNAE = modelCnae;
				model.RESTRICTION_LOCATION = modelLocal;

			    var acoesModel = that.getModel("acoesModel");
			    var acoesObject = acoesModel.getData();
			    var tableItems = acoesObject.tableItems;
			    
			    model.RESTRICTION_ACTION = [];
			    for (var i = 0; i < tableItems.length; i++) {
				    var item = tableItems[i];
				    model.RESTRICTION_ACTION.push(item);
			    }

			    jQuery.ajax({
			        url : "/accs/services/updateRestricao.xsjs",
			        method : 'PUT',
			        data : JSON.stringify(model),
			        contentType : 'application/json; charset=utf-8',
			        
			        success : function(oData, response){
				        MessageToast.show(that._oResourceBundle.getText("messageResticaoSalva"));

		 		        oModel.refresh();
				        oViewModel.setProperty("/busy", false);
				        that.onNavToWorklist();
			        },
			        error : function(oResponseError){
//				        var xmlDoc = jQuery.parseXML(oResponseError.responseText);
//				        var txtErro = xmlDoc.getElementsByTagName("DETAIL")[0].childNodes[0];
 
				        MessageBox.error(oResponseError.responseJSON.MyMessage, {
				            id : "serviceErrorMessageBox",
				            details : oResponseError.responseJSON.detalheErro,
				            actions : [
					            MessageBox.Action.CLOSE
				            ],
				            onClose : function(){
					            oViewModel.setProperty("/busy", false);

				            }.bind(this)
				        });
			        }
			    });

			    /*
				 * // Salva o registro oModel.update("/RestricaoOData(" + model.RESTRICTION_ID + ")", model, { async : false, merge : false, success : function(oData, response){ MessageToast.show(that._oResourceBundle.getText("messageResticaoSalva"));
				 * 
				 * oModel.refresh(); oViewModel.setProperty("/busy", false); that.onNavToWorklist(); }, error : function(oResponseError){ var xmlDoc = jQuery.parseXML(oResponseError.responseText); var txtErro = xmlDoc.getElementsByTagName("DETAIL")[0].childNodes[0];
				 * 
				 * MessageBox.error(txtErro.data, { id : "serviceErrorMessageBox", details : xmlDoc.getElementsByTagName("message")[0].childNodes[0].data + "\n ########## model\n" + JSON.stringify(model) + "\n ########## modelCnae\n" + JSON.stringify(modelCnae) + "\n ########## modelIndividual\n" +
				 * JSON.stringify(modelIndividual) + "\n ########## modelLocal \n" + JSON.stringify(modelLocal), actions : [ MessageBox.Action.CLOSE ], onClose : function(){ oViewModel.setProperty("/busy", false);
				 * 
				 * }.bind(this) }); } }); // Tipo de restição if (model.RESTRICTION_TYPE === "INDIVIDUAL") { oModel.update("/RestricaoIndividualOData(" + model.RESTRICTION_ID + ")", modelIndividual, { async : true, merge : false, error : function(oResponseError){ } }); } if (model.RESTRICTION_TYPE
				 * === "CNAE") { oModel.update("/RestricaoCNAEOData(" + model.RESTRICTION_ID + ")", modelCnae, { async : true, merge : false, error : function(oResponseError){ } }); } if (model.RESTRICTION_TYPE === "LOCATION") { oModel.update("/RestricaoLocalidadeOData(" + model.RESTRICTION_ID +
				 * ")", modelLocal, { async : true, merge : false, error : function(oResponseError){ } }); }
				 * 
				 * var acoesModel = that.getModel("acoesModel"); var acoesObject = acoesModel.getData(); var tableItems = acoesObject.tableItems; for (var i = 0; i < tableItems.length; i++) { var item = tableItems[i]; item.RESTRICTION_ID = model.RESTRICTION_ID; console.log(JSON.stringify(item));
				 * oModel.create("/RestricaoAcaoOData", item, { async : true, merge : false, error : function(oResponseError){ } }); }
				 */
		    }

	    },

	    /**
		 * @memberOf com.cpfl.restricao.controller.Object
		 */
	    onSelectTipoRestricao : function(oEvent){
		    var teste = oEvent.getParameter("selectedIndex");

		    this._VerifyRestricaoPanelByTipoRestricao(teste);
	    },
	    
	    onChangeTextoContr : function(oEvent){
			debugger;
			var textAreaString = oEvent.getParameter("value");
			textAreaString = textAreaString.replace(/\n\r/g,",");
			textAreaString = textAreaString.replace(/\n/g,",");
			debugger;
			this.getView().byId('inputIndividualContaContrato').setValue(textAreaString);
		},	
		
		onChangeTextoInst : function(oEvent){
			debugger;
			var textAreaString = oEvent.getParameter("value");
			textAreaString = textAreaString.replace(/\n\r/g,",");
			textAreaString = textAreaString.replace(/\n/g,",");
			debugger;
			this.getView().byId('inputIndividualInstalacao').setValue(textAreaString);
		},		
		
	    onChangeTextoParc : function(oEvent){
			debugger;
			var textAreaString = oEvent.getParameter("value");
			textAreaString = textAreaString.replace(/\n\r/g,",");
			textAreaString = textAreaString.replace(/\n/g,",");
			debugger;
			this.getView().byId('inputIndividualParceiro').setValue(textAreaString);
		},		

	    _VerifyRestricaoPanelByTipoRestricao : function(teste){
		    var oViewModel = this.getModel("objectView");
		    var oView = this.getView();
		    var oObject = oView.getBindingContext().getObject();

		    if (teste !== 0 && teste !== 1 && teste !== 2) {
			    if (oObject.RESTRICTION_TYPE === 'INDIVIDUAL') {
				    teste = 0;
			    }
			    if (oObject.RESTRICTION_TYPE === 'LOCATION') {
				    teste = 1;
			    }
			    if (oObject.RESTRICTION_TYPE === 'CNAE') {
				    teste = 2;
			    }
		    }
		    switch (teste) {
			    case 0:
				    this.byId("inputTipoRestricaoInv").setValue("INDIVIDUAL");
				    oObject.RESTRICTION_TYPE = "INDIVIDUAL";
				    oViewModel.setProperty("/fragmentIndividualVisible", true);
				    oViewModel.setProperty("/fragmentAreaRiscoVisible", false);
				    oViewModel.setProperty("/fragmentCNAEVisible", false);
				    break;
			    case 1:
				    this.byId("inputTipoRestricaoInv").setValue("LOCATION");
				    oObject.RESTRICTION_TYPE = "LOCATION";
				    oViewModel.setProperty("/fragmentIndividualVisible", false);
				    oViewModel.setProperty("/fragmentAreaRiscoVisible", true);
				    oViewModel.setProperty("/fragmentCNAEVisible", false);
				    break;
			    case 2:
				    this.byId("inputTipoRestricaoInv").setValue("CNAE");
				    oObject.RESTRICTION_TYPE = "CNAE";
				    oViewModel.setProperty("/fragmentIndividualVisible", false);
				    oViewModel.setProperty("/fragmentAreaRiscoVisible", false);
				    oViewModel.setProperty("/fragmentCNAEVisible", true);
				    break;

		    }
	    },

	    _checkIfBatchRequestSucceeded : function(oEvent){
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
		 * Handles the success of updating an object
		 * 
		 * @private
		 */
	    _fnUpdateSuccess : function(){
		    this.getModel("objectView").setProperty("/busy", false);
		    this.getModel("objectView").setProperty("/tipoRestricaoSelectedKey", -1);
		    this.getView().unbindObject();
		    this.onNavBack();
	    },

	    /**
		 * Handles the failure of creating/updating an object
		 * 
		 * @private
		 */
	    _fnEntityCreationFailed : function(){
		    this.getModel("objectView").setProperty("/busy", false);
	    },   
		onFragAcaoClose : function() {
//			
		    var oDialog = this.getView().byId("valueHelpAcao");
		    oDialog.close();
		    oDialog.destroy();		    
		},
		onFragUfClose : function() {
//			
		    var oDialog = this.getView().byId("valueHelp");
		    oDialog.close();
		    oDialog.destroy();		    
		},
		onFragMunicipioClose : function() {
//			
		    var oDialog = this.getView().byId("valueHelpMunicipio");
		    oDialog.close();
		    oDialog.destroy();		    
		},
		onFragBairroClose : function() {
//			
		    var oDialog = this.getView().byId("valueHelpBairro");
		    oDialog.close();
		    oDialog.destroy();		    
		},
		onFragLogradouroClose : function() {
//			
		    var oDialog = this.getView().byId("valueHelpLogradouro");
		    oDialog.close();
		    oDialog.destroy();		    
		},		
	    openValueHelpLogradouro : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpLogradouro");
		    var oViewModel = this.getModel("objectView");
		    // create dialog lazily
		    if (!oDialog) {
			    // create dialog via fragment factory
			    oDialog = sap.ui.xmlfragment(oView.getId(), "com.cpfl.restricao.view.ValueHelpLogradouro", this);
			    oView.addDependent(oDialog);
		    }
		    debugger;
		    var oTableSearchState = [];
		    var inputCidade = oView.byId("inputAreaRiscoMunicipio");
		    var inputBairro = oView.byId("inputAreaRiscoBairro");
		    oTableSearchState = [
		            new Filter("CODIGO_CIDADE", FilterOperator.EQ, inputCidade.getValue()), 
		            new Filter("CODIGO_BAIRRO", FilterOperator.EQ, inputBairro.getValue())
		    ];
		    var oTable = this.byId("tableFragmentLogradouro");

		    oTable.getBinding("items").filter(oTableSearchState, "Application");
		    if (oTableSearchState.length !== 0) {
			    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		    }

		    oDialog.setEscapeHandler(function(){
			    oDialog.close();
			    oDialog.destroy();
		    });
		    oDialog.open();

	    },
	    
	    onUpdateFinished : function(){
	    	debugger;
	    	var oTable = this.byId("tableFragmentLogradouro");
	    	var oItems = oTable.getItems();
	    	var inLogr = this.getView().byId("inputAreaRiscoLogradouro");
	    	var aTokens = inLogr.getTokens();
	    	
	    	for (var i = 0; i < aTokens.length; i++) {   		
	    		
			    for (var j = 0; j < oItems.length; j++) {
				    var item = oItems[j];
				    var itemObject = item.getBindingContext().getObject();		    
					var token = aTokens[i];
					if(token.getText() === itemObject.CODIGO_LOGRADOURO || 
							token.getKey() === itemObject.CODIGO_LOGRADOURO){
						oItems[j].setSelected(true);
						break;						
					}		    

			    }				
			}	
	    	
	    	
	    },
	    onFragmentFilterLogradouro : function(){
		    var oTableSearchState = [];
		    var oViewModel = this.getModel("objectView");
		    var inputFilterValue = this.byId("idValueHelpLogradouroFiltroLogradouro").getValue();
		    var oView = that.getView();
		    var inputMunicipio = oView.byId("inputAreaRiscoMunicipio");
		    var inputBairro = oView.byId("inputAreaRiscoBairro");
		    debugger;
		    
		    oTableSearchState = [
		    	new Filter("CODIGO_CIDADE", FilterOperator.EQ, inputMunicipio.getValue()), 
	            new Filter("CODIGO_BAIRRO", FilterOperator.EQ, inputBairro.getValue()),
			    new Filter("LOGRADOURO", FilterOperator.Contains, inputFilterValue)
		    ];
		    var oTable = this.byId("tableFragmentLogradouro");

		    oTable.getBinding("items").filter(oTableSearchState, "Application");
		    if (oTableSearchState.length !== 0) {
			    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		    }

	    },
	    onFragmentFilterLogradouroSelect : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpLogradouro");
		    var tableFragment = oView.byId("tableFragmentLogradouro");
		    var input = oView.byId("inputAreaRiscoLogradouro");
		    debugger;
		    
		    var items = tableFragment.getSelectedItems();
		    if(items.length > 0){
		    	input.destroyTokens();
		    }
		    
		    for (var i = 0; i < items.length; i++) {
			    var item = items[i];
			    var itemObject = item.getBindingContext().getObject();	
			    debugger;
				var token = new sap.m.Token();
				token.setKey(itemObject.CODIGO_LOGRADOURO);
				token.setText(itemObject.LOGRADOURO);
				input.addToken(token);			    

		    }		    
		    
//		    if (tableFragment.getSelectedItem()) {
//			    var path = tableFragment.getSelectedItem().getBindingContextPath();
//			    debugger;
//			    this.getModel().read(path, {
//			        success : function(oData, response){
//			        	debugger;
//			        	for (var i = 0; i < oData.length; i++) {
//							var token = new sap.m.Token();
//							token.setKey(oData.CODIGO_LOGRADOURO);
//							token.setText(oData.LOGRADOURO);
//							input.addToken(token);
//						}
////				        input.setValue(oData.CODIGO_LOGRADOURO);
////				        input.setDescription(oData.LOGRADOURO);
//
//			        },
//			        error : function(oError){
////				        debugger;
//			        }
//			    });
//		    }

		    oDialog.close();
		    oDialog.destroy();

	    },

	    openValueHelpUf : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelp");
		    // create dialog lazily
		    if (!oDialog) {
			    // create dialog via fragment factory
			    oDialog = sap.ui.xmlfragment(oView.getId(), "com.cpfl.restricao.view.ValueHelpUf", this);
			    oView.addDependent(oDialog);
		    }
		    oDialog.setEscapeHandler(function(){
			    oDialog.close();
			    oDialog.destroy();
		    });

		    oDialog.open();

	    },

	    onFragmentFilterUF : function(){
		    var oTableSearchState = [];
		    var oViewModel = this.getModel("objectView");
		    var inputFilterValue = this.byId("idValueHelpUfFiltroUF").getValue();
		    oTableSearchState = [
			    new Filter("UF", FilterOperator.Contains, inputFilterValue)
		    ];
		    var oTable = this.byId("tableFragmentUF");

		    oTable.getBinding("items").filter(oTableSearchState, "Application");
		    if (oTableSearchState.length !== 0) {
			    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		    }

	    },
	    onFragmentFilterUfSelect : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelp");
		    var tableFragmentUf = oView.byId("tableFragmentUF");
		    var inputUf = oView.byId("inputAreaRiscoUF");

		    if (tableFragmentUf.getSelectedItem()) {
			    var path = tableFragmentUf.getSelectedItem().getBindingContextPath();

			    this.getModel().read(path, {
			        success : function(oData, response){
				        inputUf.setValue(oData.CODIGO_UF);
				        inputUf.setDescription(oData.UF);
				        oView.byId("inputAreaRiscoMunicipio").setValue("");
				        oView.byId("inputAreaRiscoMunicipio").setDescription("");
				        oView.byId("inputAreaRiscoBairro").setValue("");
				        oView.byId("inputAreaRiscoBairro").setDescription("");
//				        oView.byId("inputAreaRiscoLogradouro").setValue("");
				        oView.byId("inputAreaRiscoLogradouro").destroyTokens();
//				        oView.byId("inputAreaRiscoLogradouro").setDescription("");
			        },
			        error : function(oError){
//				        debugger;
			        }
			    });
		    }
		    oDialog.close();
		    oDialog.destroy();

	    },

	    openValueHelpBairro : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpBairro");
		    var oViewModel = this.getModel("objectView");
		    var inputMunicipio = oView.byId("inputAreaRiscoMunicipio");
		    // create dialog lazily
		    if (!oDialog) {
			    // create dialog via fragment factory
			    oDialog = sap.ui.xmlfragment(oView.getId(), "com.cpfl.restricao.view.ValueHelpBairro", this);
			    oView.addDependent(oDialog);
		    }

		    var oTableSearchState = [];
		    oTableSearchState = [
			    new Filter("CODIGO_CIDADE", FilterOperator.EQ, inputMunicipio.getValue())
		    ];
		    var oTable = this.byId("tableFragmentBairro");

		    oTable.getBinding("items").filter(oTableSearchState, "Application");
		    if (oTableSearchState.length !== 0) {
			    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		    }
		    oDialog.setEscapeHandler(function(){
			    oDialog.close();
			    oDialog.destroy();
		    });
		    oDialog.open();

	    },

	    onFragmentFilterBairro : function(){
		    var oTableSearchState = [];
		    var oViewModel = this.getModel("objectView");
		    var inputFilterValue = this.byId("idValueHelpBairroFiltroBairro").getValue();
		    var oView = that.getView();
		    var inputMunicipio = oView.byId("inputAreaRiscoMunicipio");
		    
		    if (inputFilterValue !== "") {
			    oTableSearchState = [
			    	new Filter("CODIGO_CIDADE", FilterOperator.Contains, inputMunicipio.getValue()),
				    new Filter("BAIRRO", FilterOperator.Contains, inputFilterValue)
			    ];
			    var oTable = this.byId("tableFragmentBairro");

			    oTable.getBinding("items").filter(oTableSearchState, "Application");
			    if (oTableSearchState.length !== 0) {
				    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			    }
		    }

	    },

	    onFragmentFilterBairroSelect : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpBairro");
		    var tableFragment = oView.byId("tableFragmentBairro");
		    var input = oView.byId("inputAreaRiscoBairro");

		    if (tableFragment.getSelectedItem()) {
			    var path = tableFragment.getSelectedItem().getBindingContextPath();

			    this.getModel().read(path, {
			        success : function(oData, response){
				        input.setValue(oData.CODIGO_BAIRRO);
				        input.setDescription(oData.BAIRRO);
//				        oView.byId("inputAreaRiscoLogradouro").setValue("");
//				        oView.byId("inputAreaRiscoLogradouro").setDescription("");
				        oView.byId("inputAreaRiscoLogradouro").destroyTokens();				        
			        },
			        error : function(oError){
//				        debugger;
			        }
			    });
		    }
		    oDialog.close();
		    oDialog.destroy();

	    },

	    openValueHelpMunicipio : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpMunicipio");
		    var inputUF = oView.byId("inputAreaRiscoUF");
		    var oViewModel = this.getModel("objectView");

		    // create dialog lazily
		    if (!oDialog) {
			    // create dialog via fragment factory
			    oDialog = sap.ui.xmlfragment(oView.getId(), "com.cpfl.restricao.view.ValueHelpMunicipio", this);
			    oView.addDependent(oDialog);
		    }

		    var oTableSearchState = [];
		    oTableSearchState = [
			    new Filter("UF", FilterOperator.EQ, inputUF.getValue())
		    ];
		    var oTable = this.byId("tableFragmentMunicipio");

		    oTable.getBinding("items").filter(oTableSearchState, "Application");
		    if (oTableSearchState.length !== 0) {
			    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		    }
		    oDialog.setEscapeHandler(function(){
			    oDialog.close();
			    oDialog.destroy();
		    });
		    oDialog.open();

	    },

	    onFragmentFilterMunicipio : function(){
		    var oTableSearchState = [];
		    var oViewModel = this.getModel("objectView");
		    var inputFilterValue = this.byId("idValueHelpMunicipioFiltroMunicipio").getValue();
		    var oView = that.getView();
		    var inputUF = oView.byId("inputAreaRiscoUF");
		    
		    oTableSearchState = [
		    	new Filter("UF", FilterOperator.EQ, inputUF.getValue()),
		    	new Filter("CIDADE", FilterOperator.Contains, inputFilterValue)
		    ];
		    var oTable = this.byId("tableFragmentMunicipio");

		    oTable.getBinding("items").filter(oTableSearchState, "Application");
		    if (oTableSearchState.length !== 0) {
			    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		    }

	    },

	    onFragmentFilterMunicipioSelect : function(oEvent){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpMunicipio");
		    var tableFragment = oView.byId("tableFragmentMunicipio");
		    var input = oView.byId("inputAreaRiscoMunicipio");

		    if (tableFragment.getSelectedItem()) {
			    var path = tableFragment.getSelectedItem().getBindingContextPath();

			    this.getModel().read(path, {
			        success : function(oData, response){
				        input.setValue(oData.CODIGO_CIDADE);
				        input.setDescription(oData.CIDADE);
				        
				        oView.byId("inputAreaRiscoBairro").setValue("");
				        oView.byId("inputAreaRiscoBairro").setDescription("");
//				        oView.byId("inputAreaRiscoLogradouro").setValue("");
//				        oView.byId("inputAreaRiscoLogradouro").setDescription("");
				        oView.byId("inputAreaRiscoLogradouro").destroyTokens();
			        },
			        error : function(oError){
//				        debugger;
			        }
			    });

		    }
		    oDialog.close();
		    oDialog.destroy();

	    },
	    onGoToMotivoRestricaoApp : function(){
		    window.open("/accs/ui5/motivoRestricao/webapp/index.html", "_blank");
	    },
	    onDeleteActionRow : function(e){
		    var oTable = that.byId("tableAcoes");
		    var oItems = oTable.getSelectedItems();
		    var acoesModel = this.getModel("acoesModel");
		    var oCoesModelData = acoesModel.getData();

		    for (var i = 0; i < oItems.length; i++) {
			    var item = oItems[i];
			    var sPath = item.getBindingContextPath();
			    var index = sPath.replace(/[^0-9\.]/g, '');

			    oCoesModelData.tableItems.splice(index, 1);
			    acoesModel.setData(oCoesModelData);

		    }

	    },
	    onPressRefreshMotivo : function(){
		    var oViewModel = this.getModel();
		    oViewModel.refresh(true);
	    },
	    
	    onPressIncluirAcao : function(){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpAcao");
		    var inputAcao = oView.byId("inputAcaoEmpresa");
		    var oViewModel = this.getModel("objectView");
		    if(inputAcao.getSelectedKey() === ""){
		    	MessageToast.show(that._oResourceBundle.getText("selecionarEmpresaParaIncluirAcao"));
		    }else{
			    // create dialog lazily
			    if (!oDialog) {
				    // create dialog via fragment factory
				    oDialog = sap.ui.xmlfragment(oView.getId(), "com.cpfl.restricao.view.ValueHelpAcoes", this);
				    oView.addDependent(oDialog);
			    }
	
			    var oTableSearchState = [];
			    oTableSearchState = [
				    new Filter("BUKRS", FilterOperator.EQ, inputAcao.getSelectedKey())
			    ];
			    var oTable = this.byId("tableFragmentAcao");
	
			    oTable.getBinding("items").filter(oTableSearchState, "Application");
			    if (oTableSearchState.length !== 0) {
				    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			    }
			    oDialog.setEscapeHandler(function(){
				    oDialog.close();
				    oDialog.destroy();
			    });
			    oDialog.open();
		    }
	    },
	    onFragmentFilterAcao : function(){
		    var oTableSearchState = [];
		    var oViewModel = this.getModel("objectView");
		    var oView = that.getView();
		    var inputFilterValue = this.byId("idValueHelpAcaoFiltroAcao").getValue();
		    var inputAcaoEmpresa = oView.byId("inputAcaoEmpresa").getSelectedKey();

		    oTableSearchState = [
			    new Filter("NAME", FilterOperator.Contains, inputFilterValue),
			    new Filter("BUKRS", FilterOperator.EQ, inputAcaoEmpresa)
		    ];
		    var oTable = this.byId("tableFragmentAcao");

		    oTable.getBinding("items").filter(oTableSearchState, "Application");
		    if (oTableSearchState.length !== 0) {
			    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
		    }

	    },

	    onFragmentFilterAcaoSelect : function(){
		    var oView = this.getView();
		    var oDialog = oView.byId("valueHelpAcao");
		    var tableFragment = oView.byId("tableFragmentAcao");

		    var items = tableFragment.getSelectedItems();
		    var acoesModel = this.getModel("acoesModel");
		    var oCoesModelData;
		    if (!acoesModel) {
			    oCoesModelData = {};
			    oCoesModelData.tableItems = [];
			    acoesModel = new JSONModel(oCoesModelData);
			    this.setModel(acoesModel, "acoesModel");
		    }
		    oCoesModelData = acoesModel.getData();
		    for (var i = 0; i < items.length; i++) {
			    var item = items[i];
			    var itemObject = item.getBindingContext().getObject();

			    oCoesModelData.tableItems.push({
			        RESTRICTION_ID : itemObject.RESTRICTION_ID,
			        ACTION_ID : itemObject.ACTION_ID,
			        NAME : itemObject.NAME,
			    	BUKRS : itemObject.BUKRS,
			        BUTXT : this.byId("inputAcaoEmpresa").getSelectedItem().getText()
			    });

		    }

		    acoesModel.setData(oCoesModelData);

		    oDialog.close();
		    oDialog.destroy();
	    },

	    submitInputUF : function(oEvent){
		    var input = this.byId("inputAreaRiscoUF");
		    var value = input.getValue();
		    that = this;
		    var oModel = this.getModel();

		    oModel.read("/ufOData('" + value + "')", {
		        success : function(oResponseSucess){
			        input.setDescription(oResponseSucess.UF);
		        },
		        error : function(oResponseError){
			        var filters = new Array();
			        var filterByName = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, value)
			        filters.push(filterByName);

			        oModel.read("/ufOData", {
			            filters : filters,
			            success : function(oResponseSucess){
				            if (oResponseSucess.results.length > 0) {
					            input.setValue(oResponseSucess.results[0].CODIGO_UF);
					            input.setDescription(oResponseSucess.results[0].UF);
				            } else {
					            MessageToast.show(that._oResourceBundle.getText("registroNaoEncontrado"));
				            }

			            },
			            error : function(oResponseError){
				            MessageToast.show(that._oResourceBundle.getText("registroNaoEncontrado"));
			            }

			        });

		        }

		    });

	    },

	    submitInputMunicipio : function(oEvent){
		    var inputUf = this.byId("inputAreaRiscoUF");
		    var input = this.byId("inputAreaRiscoMunicipio");
		    var value = input.getValue();
		    that = this;
		    var oModel = this.getModel();

		    oModel.read("/cidadeOData('" + value + "')", {
		        success : function(oResponseSucess){
			        input.setDescription(oResponseSucess.CIDADE);
		        },
		        error : function(oResponseError){
			        var filters = new Array();
			        var filterByName = new sap.ui.model.Filter("CIDADE", sap.ui.model.FilterOperator.EQ, value)
			        filters.push(filterByName);
			        var filterByUF = new sap.ui.model.Filter("UF", sap.ui.model.FilterOperator.EQ, inputUf.getValue())
			        filters.push(filterByUF);

			        oModel.read("/cidadeOData", {
			            filters : filters,
			            success : function(oResponseSucess){
				            if (oResponseSucess.results.length > 0) {
					            input.setValue(oResponseSucess.results[0].CODIGO_CIDADE);
					            input.setDescription(oResponseSucess.results[0].CIDADE);

				            } else {
					            MessageToast.show(that._oResourceBundle.getText("registroNaoEncontrado"));
				            }

			            },
			            error : function(oResponseError){
				            MessageToast.show(that._oResourceBundle.getText("registroNaoEncontrado"));
			            }

			        });
		        }

		    });

	    },
	    handleSuggestMunicipio : function(oEvent){
		    var sTerm = oEvent.getParameter("suggestValue");
		    var input = this.byId("inputAreaRiscoUF");

		    var aFilters = [];
		    aFilters.push(new Filter("UF", sap.ui.model.FilterOperator.EQ, input.getValue()));
		    if (sTerm) {
			    aFilters.push(new Filter("CIDADE", sap.ui.model.FilterOperator.StartsWith, sTerm));
		    }

		    oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
	    },
	    
	    submitInputBairro : function(oEvent){
		    var input = this.byId("inputAreaRiscoBairro");
		    var value = input.getValue();
		    that = this;
		    var oModel = this.getModel();
//		    var jsonModel = sap.ui.getCore().getModel("editModel");
////			if(value ===""){
////				value = jsonModel
////			}
		    oModel.read("/bairroOData('" + value + "')", {
		        success : function(oResponseSucess){
			        input.setDescription(oResponseSucess.BAIRRO);
//			        that.byId("inputAreaRiscoLogradouro").setValue("");
//			        that.byId("inputAreaRiscoLogradouro").setDescription("");
		        },
		        error : function(oResponseError){
			        MessageToast.show(that._oResourceBundle.getText("registroNaoEncontrado"));
		        }

		    });

	    },
	    
	    onCNAE : function(){

			var oInput = this.getView().byId("inputCnaeCnae");
			var oViewModel = this.getModel("objectView");
			var oModel = this.getModel();
			
			var oValueHelp = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idCnaetHelp", {
				supportMultiselect : true,
				title : "CNAE",
				key : "IND_SECTOR",
				descriptionKey : "TEXT",
				ok : function(oEventTipo) {
//					oInput.setValue(" ");
					
					oInput.destroyTokens();
					var aTokens = oEventTipo.getParameter("tokens");
					debugger;
					oInput.setTokens(aTokens);
//					for (var i = 0; i < aTokens.length; i++) {
//						var token = aTokens[i];
//						oInput.setValue(token.getKey());
//					}
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
//			oTable.setModel(this.getModel());
//			oTable.bindRows("/cnaeOData");
//			oValueHelp.open();
//			oValueHelp.update();
			oModel.read("/cnaeOData", {
				// filters : filters,
				success : function(oResponseSucess) {
					// that.aItemsCidade = [];				
					debugger;
					var sTable = [];
					for (var i = 0; i < oResponseSucess.results.length; i++) {
						var sort = {};
						sort.IND_SECTOR = oResponseSucess.results[i].IND_SECTOR;
						sort.TEXT = oResponseSucess.results[i].TEXT;
						
						sTable.push(sort);
					}

					var sortedTable = sTable.sort(function(a, b){
					    var nameA=a.TEXT.toLowerCase(), nameB=b.TEXT.toLowerCase();
					    if (nameA < nameB) //sort string ascending
					        return -1; 
					    if (nameA > nameB)
					        return 1;
					    return 0; //default return value (no sorting)
					});					
					
					var oTable = oValueHelp.getTable();
					oTable.setModel(oColModel, "columns");

					var oRowsModel = new sap.ui.model.json.JSONModel();
					oRowsModel.setData(sortedTable);
					oTable.setModel(oRowsModel);
					if (oTable.bindRows) {
						oTable.bindRows("/");
					}
					var aTokens = that.getView().byId("inputCnaeCnae").getTokens();
					oValueHelp.setTokens(aTokens);
					
					oValueHelp.addStyleClass("sapUiSizeCozy");
					oValueHelp.open();
					oValueHelp.update();

				},
				error : function(oResponseSucess) {

				}

			});				
	    },

	    submitInputLogradouro : function(oEvent){
		    var input = this.byId("inputAreaRiscoLogradouro");
		    var value = input.getValue();
		    that = this;
		    var oModel = this.getModel();

		    oModel.read("/logradouroOData('" + value + "')", {
		        success : function(oResponseSucess){
			        input.setDescription(oResponseSucess.LOGRADOURO);
		        },
		        error : function(oResponseError){
			        MessageToast.show(that._oResourceBundle.getText("registroNaoEncontrado"));
		        }

		    });

	    }

	});
});
