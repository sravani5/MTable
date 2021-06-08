/*global location history */
sap.ui.define([
	"tab/ZMTable/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"tab/ZMTable/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/export/Spreadsheet"
], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator,Spreadsheet) {
	"use strict";

	return BaseController.extend("tab.ZMTable.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			this._loadProductDetails();

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			// this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPressNav: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("worklistView"),
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

		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("ProductID", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("ProductID")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},
		onPressAdd: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oTable = this.getView().byId("table");
			var oContext = this.getView().getModel().createEntry("/ProductSet", {});
			var items = this.oTemplateMultiAdd();
			items.data("newRowData", "newRow");
			items.setBindingContext(oContext);
			oTable.addItem(items);
		},
		oTemplateMultiAdd: function() {
			var items = new sap.m.ColumnListItem({
				cells: [new sap.m.Input({
						value: "{Category}",
						change: function(oEvnt) {
							this.onValueChage(oEvnt);
						}.bind(this)
					}),
					new sap.m.Input({
						value: "{ProductID}",
						change: function(oEvnt) {
							this.onValueChage(oEvnt);
						}.bind(this)
					}),
					new sap.m.Input({
						value: "{TypeCode}",
						change: function(oEvnt) {
							this.onValueChage(oEvnt);
						}.bind(this)
					}),
					new sap.m.Input({
						value: "{Name}",
						change: function(oEvnt) {
							this.onValueChage(oEvnt);
						}.bind(this)
					})
				]
			});
			return items;
		},
		onValueChage: function(oEvnt) {
			var Path = oEvnt.getSource().getBinding("value").sPath;
			var oCntx = oEvnt.getSource().getParent().getBindingContext();
			oCntx.getModel().setProperty(oCntx.getPath() + "/" + Path, oEvnt.getSource().getValue());
		},
		_loadProductDetails: function() {
			var oModel = this.getOwnerComponent().getModel();
			oModel.read("/ProductSet", {
				success: function(data) {
					sap.m.MessageToast.show("Product Details Load Successfullty");
					// console.log(data);
				},
				error: function(err) {}
			});

		},
		onPressDelete: function(oEvnt) {
			var oTable = this.getView().byId("table"),
				aItems = oTable.getSelectedItems(),
				oModel = this.getModel();
			if (aItems.length === 0) {
				sap.m.MessageBox.show(
					"Please Select atleast one item to delete", {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: "Delete",
						actions: [sap.m.MessageBox.Action.OK]
					}
				);
				return;
			} else {
				sap.m.MessageBox.show("Are You sure you want to delete the selected items?", {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: "Confirm",
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function(oAction) {
						if (oAction === "YES") {
							$.each(aItems, function(i) {
								var listItem = aItems[i],
									sPath = listItem.getBindingContextPath();
								if (listItem.data("newRowData") === "newRow") {
									oTable.removeItem(listItem);
									oModel.deleteCreatedEntry(listItem.getBindingContext());
								} else {
									oModel.remove(sPath, {
										success: function(oData, oResponse) {
											sap.m.MessageBox.show("Selected Line Item Deleted Successfully");
										},
										error: function(oError) {
											sap.m.MessageBox.show("Error While Deleting Selected Line Items");
										}
									});
								}

								// oTable.removeItem(listItem);
								// oModel.resetChanges([sPath]);

							});
						}
					}.bind(this)
				});

			}
			oTable.removeSelections();
		},
		onPressSave: function() {
			var oModel = this.getOwnerComponent().getModel(),
				oTable = this.getView().byId("table"),
				aSelItems = oTable.getSelectedItems();
			if (aSelItems.length === 0) {
				sap.m.MessageBox.error("Please Select One item to Save");
				return;
			} else {
				var mParameters = {
					"groupId": "changes",
					success: function(odata) {
						sap.m.MessageBox.show("Product Details Saved Successfullty");
					},
					error: function(error) {}
				};
				oModel.submitChanges(mParameters);
			}
		},
		onPressAddColumn: function() {
			var oTable = this.getView().byId("table");
			oTable.addColumn(new sap.m.Column({
				header: new sap.m.Label({
					text: "Description" //data[0].KURZNAME
				})
			}));
		},
		handleValueChange: function() {
			var oFileUpId = this.byId("fileUpload"),
				domRef = oFileUpId.getFocusDomRef(),
				file = domRef.files[0];
			oFileUpId.clear();
			this._import(file);
		},
		_creatobjPy: function(Data) {
			var excelArray = [];
			for (var i = 0; i < Data.length; i++) {
				var data = Data[i];
				var oExcelJson = {};
				oExcelJson.Category = data["Category"] ? data["Category"].trim() : "";
				oExcelJson.ProductID = data["Product ID"] ? data["Product ID"].trim() : "";
				oExcelJson.TypeCode = data["Type Code"] ? data["Type Code"].trim() : "";
				oExcelJson.Name = data["Name"] ? data["Name"].trim() : "";

				excelArray.push(oExcelJson);

			}
			var oModel = this.getOwnerComponent().getModel();
			var oTable = this.getView().byId("table");
			var that = this;
			$.each(excelArray, function(i, val) {
				var oContext = oModel.createEntry("/ProductSet", {
					properties: val
				});
				var items = that.oTemplateMultiAdd();
				items.setBindingContext(oContext);
				oTable.addItem(items);

			});

			// sap.m.MessageToast.show("Excel data Loaded");
		},

		createColumnConfig: function() {
			return [{
				label: "Category",
				property: "Category",
				type: 'number'
			}, {
				label: "Product ID",
				property: "ProductID",
				type: 'string'
			}, {
				label: "Type Code",
				property: "TypeCode",
				type: 'string'
			}, {
				label: "Name",
				property: "Name",
				type: 'date'
			}, {
				label: "Name1",
				property: "Destructiondue",
				type: 'date'
			}];

		},
		onExportDownload: function(oEvnt) {
			var aCols, oSettings, oSheet, oExcelJson = [];
			oExcelJson.push({
				Category: "",
				ProductID: "",
				TypeCode: "",
				Name: ""
			});
			aCols = this.createColumnConfig();
			oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: oExcelJson
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function() {
					sap.m.MessageToast.show('Spreadsheet export has finished');
				})
				.finally(function() {
					oSheet.destroy();
				});
		}

	});
});